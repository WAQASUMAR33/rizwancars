import { NextResponse } from "next/server";
import prisma from "@/utils/prisma"; // Adjust path to your Prisma client

export async function POST(request) {
  try {
    const data = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { status: false, error: "Expected an array of PortCollect records" },
        { status: 400 }
      );
    }

    // Validate each record
    for (const record of data) {
      if (!record.vehicleNo || !record.invoiceno) {
        return NextResponse.json(
          { status: false, error: "Vehicle Number and Invoice Number are required for all records" },
          { status: 400 }
        );
      }
    }

    // Save all records in a transaction
    const portCollects = await prisma.$transaction(
      data.map((record) =>
        prisma.portCollect.create({
          data: {
            vehicleNo: record.vehicleNo,
            date: new Date(record.date),
            freight_amount: record.freight_amount || 0,
            port_charges: record.port_charges || 0,
            clearingcharges: record.clearingcharges || 0,
            othercharges: record.othercharges || 0,
            totalAmount: record.totalAmount || 0,
            vamount: record.vamount || 0,
            invoiceno: record.invoiceno,
            imagePath: record.imagePath || "",
            admin_id: record.admin_id,
          },
        })
      )
    );

    return NextResponse.json({ status: true, data: portCollects }, { status: 201 });
  } catch (error) {

    return NextResponse.json(
      { status: false, error: "Failed to save PortCollect data" },
      { status: 500 }
    );
  }
}



export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { status: false, error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Log Prisma initialization
    console.log("Prisma client initialized:", !!prisma);

    // Check if AddVehicle model exists
    if (!prisma.addVehicle) {
      throw new Error("AddVehicle model not found in Prisma client");
    }

    await prisma.$connect();
    console.log("Database connection successful");

    const vehicleId = parseInt(query, 10);
    const isNumeric = !isNaN(vehicleId);

    const vehicle = await prisma.addVehicle.findFirst({
      where: {
        OR: [
          ...(isNumeric ? [{ id: vehicleId }] : []),
          { chassisNo: query },
        ],
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { status: false, error: "No vehicle found for the given query" },
        { status: 404 }
      );
    }

    // Return vehicle data mapped to match CollectVehicle expectations
    return NextResponse.json({
      status: true,
      data: {
        vehicleId: vehicle.id, // Map 'id' to 'vehicleId'
        chassisNo: vehicle.chassisNo,
        year: vehicle.year,
        color: vehicle.color,
        cc: vehicle.engineType || "N/A", // Use engineType as a fallback for cc, or "N/A" if not applicable
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      { status: false, error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}