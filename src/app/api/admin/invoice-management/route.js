// app/api/admin/invoice-management/NewInvoice/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

// ✅ POST: Display request data as JSON (no database transactions)import { NextResponse } from 'next/server';



// export async function POST(request) {
//   console.log("POST request received at /api/admin/invoice-management");

//   try {
//     const contentType = request.headers.get("Content-Type") || "";
//     console.log("Content-Type received:", contentType);

//     if (!contentType.includes("application/json")) {
//       return NextResponse.json(
//         {
//           message: "Failed to process request",
//           status: false,
//           error: "Content-Type must be 'application/json'",
//         },
//         { status: 400 }
//       );
//     }

//     // Parse application/json
//     const data = await request.json();

//     // Log the received data
//     console.log("Received JSON Data:", JSON.stringify(data, null, 2));

//     // Return the received data for testing
//     return NextResponse.json({
//       message: "Data received successfully",
//       status: true,
//       data: data,
//     }, { status: 200 });
//   } catch (error) {
//     console.error("Error processing request:", error.stack || error);
//     return NextResponse.json(
//       {
//         message: "Unexpected server error occurred",
//         status: false,
//         error: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

// Adjust path as per your project structure


// app/api/admin/invoice-management/NewInvoice/route.js

// ✅ POST: Create a new invoice with vehicles and images
// ✅ POST: Create a new invoice with vehicles and images (accepts JSON with image paths)




export async function POST(request) {
  console.log("POST request received at /api/admin/invoice-management");

  try {
    const contentType = request.headers.get("Content-Type") || "";
    console.log("Content-Type received:", contentType);

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          message: "Failed to process request",
          status: false,
          error: "Content-Type must be 'application/json'",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Received JSON Data:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.date) throw new Error("Missing required field: date");
    if (!body.number) throw new Error("Missing required field: number");
    if (!body.status) throw new Error("Missing required field: status");
    if (!body.added_by) throw new Error("Missing required field: added_by");

    const result = await prisma.$transaction(async (tx) => {
      // Create invoice
      const invoiceData = {
        date: new Date(body.date),
        number: parseInt(body.number, 10),
        amount: parseFloat(body.amount) || 0,
        status: body.status || 'UNPAID', // Updated to match InvoiceStatus enum
        auctionHouse: body.auctionHouse || "",
        imagePath: body.imagePath || "",
        amountYen: parseFloat(body.amountYen) || 0,
        added_by: parseInt(body.added_by),
      };
      const invoice = await tx.invoice.create({ data: invoiceData });
      console.log("Invoice created:", invoice);

      // Create vehicles
      const vehicleDataList = (body.vehicles || []).map((vehicle) => ({
        invoiceNo: vehicle.invoiceNo || invoice.number.toString(),
        chassisNo: vehicle.chassisNo || "",
        maker: vehicle.maker || "",
        year: parseInt(vehicle.year, 10) || 0,
        color: vehicle.color || "",
        engineType: vehicle.engineType || "",
        tenPercentAdd: parseFloat(vehicle.tenPercentAdd) || 0,
        recycleAmount: parseFloat(vehicle.recycleAmount) || 0,
        auctionFee: parseFloat(vehicle.auctionFee) || 0,
        auctionFeeAmount: parseFloat(vehicle.auctionFeeAmount) || 0,
        bidAmount: parseFloat(vehicle.bidAmount) || 0,
        commissionAmount: parseFloat(vehicle.commissionAmount) || 0,
        numberPlateTax: parseFloat(vehicle.numberPlateTax) || 0,
        repairCharges: parseFloat(vehicle.repairCharges) || 0,
        totalAmount: parseFloat(vehicle.totalAmount) || 0,
        sendingPort: vehicle.sendingPort || "",
        additionalAmount: vehicle.additionalAmount || "",
        isDocumentRequired: vehicle.isDocumentRequired || "no",
        documentReceiveDate: vehicle.documentReceiveDate ? new Date(vehicle.documentReceiveDate) : null,
        isOwnership: vehicle.isOwnership || "no",
        ownershipDate: vehicle.ownershipDate ? new Date(vehicle.ownershipDate) : null,
        status: vehicle.status || "Pending",
        distributor_id: parseInt(vehicle.distributor_id, 10) || 1,
        added_by: parseInt(body.added_by),
      }));

      const createdVehicles = await Promise.all(
        vehicleDataList.map(async (data, index) => {
          const vehicle = await tx.addVehicle.create({ data });
          const vehicleImages = body.vehicles[index]?.vehicleImages || [];
          if (vehicleImages.length > 0) {
            await tx.vehicleImage.createMany({
              data: vehicleImages.map((imagePath) => ({
                addVehicleId: vehicle.id,
                imagePath: imagePath,
              })),
              skipDuplicates: true,
            });
          }
          return vehicle;
        })
      );

      // Payment logic for PAID status
      if (body.status === 'PAID') { // Changed from amountStatus to status
        const lastTransaction = await tx.transactions.findFirst({
          where: { admin_id: parseInt(body.added_by) },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = lastTransaction ? lastTransaction.balance : 0;
        const invoiceAmount = parseFloat(body.amount) || 0;
        const newBalance = currentBalance - invoiceAmount;

        if (newBalance < 0) {
          throw new Error('Insufficient admin balance for this transaction');
        }

        await tx.transactions.create({
          data: {
            admin_id: parseInt(body.added_by),
            distributor_id: createdVehicles.length > 0 ? parseInt(createdVehicles[0].distributor_id) : 1,
            amountin: 0,
            amountout: invoiceAmount,
            preBalance: currentBalance,
            balance: newBalance,
            details: `Payment for Invoice #${invoice.number}`,
            added_by: parseInt(body.added_by),
          },
        });
      }

      return { invoice, vehicles: createdVehicles };
    });

    console.log("Transaction completed, data saved:", JSON.stringify(result, null, 2));

    return NextResponse.json({
      message: "Invoice and vehicles created successfully",
      status: true,
      data: result,
    }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('number')) {
      return NextResponse.json(
        {
          message: "An invoice with this number already exists",
          status: false,
          error: "Duplicate invoice number",
        },
        { status: 400 }
      );
    }
    console.error("Error processing request:", error.stack || error);
    return NextResponse.json(
      {
        message: "Unexpected server error occurred",
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
    

// ✅ GET: Fetch all Invoices with Associated Vehicles and Vehicle Images
export async function GET() {
  try {
    console.log("Fetching invoices with related vehicles and images...");
    
    // Fetch all invoices
    const invoices = await prisma.Invoice.findMany();
    
    // Fetch all vehicles with their images
    const addVehicles = await prisma.AddVehicle.findMany({
      include: {
        vehicleImages: true, // Include related VehicleImage records
      },
    });

    // Manually join invoices with vehicles based on invoiceNo matching number
    const joinedData = invoices.map(invoice => ({
      ...invoice,
      addVehicles: addVehicles.filter(vehicle => vehicle.invoiceNo === invoice.number.toString())
        .map(vehicle => ({
          ...vehicle,
          vehicleImages: vehicle.vehicleImages, // Already included from prisma query
        })),
    }));

    console.log("Joined data:", JSON.stringify(joinedData, null, 2));

    return NextResponse.json({
      message: "Invoices fetched successfully",
      status: true,
      data: joinedData,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      {
        message: 'Failed to fetch invoices',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}