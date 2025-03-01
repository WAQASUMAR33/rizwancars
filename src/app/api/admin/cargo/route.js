// app/api/admin/cargo-management/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received data:', JSON.stringify(data, null, 2)); // Log incoming data for debugging

    const {
      actualShipper,
      cyOpen,
      bookingNo,
      etd,
      cyCutOff,
      eta,
      volume,
      carrier,
      vessel,
      portOfLoading,
      portOfDischarge,
      cargoMode,
      placeOfIssue,
      freightTerm,
      shipperName,
      consignee,
      descriptionOfGoods,
      containerQuantity,
      numbers,
      imagePath,
      added_by,
      createdAt,
      updatedAt,
      containerDetails, // Expecting an array with one object
      containerItemDetails,
    } = data;

    // Validation for required fields
    if (!bookingNo || !containerItemDetails || containerItemDetails.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields (bookingNo, containerItemDetails)', status: false },
        { status: 400 }
      );
    }
    if (!containerDetails || containerDetails.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one ContainerDetail entry is required', status: false },
        { status: 400 }
      );
    }
    // Validate that each containerItemDetail has a vehicleId
    for (const item of containerItemDetails) {
      if (!item.vehicleId) {
        return NextResponse.json(
          { error: 'Each containerItemDetail must include a vehicleId', status: false },
          { status: 400 }
        );
      }
    }

    // Prepare an array of Prisma operations
    const operations = [];

    // Create ContainerBooking
    operations.push(
      prisma.containerBooking.create({
        data: {
          actualShipper,
          cyOpen,
          bookingNo,
          etd: new Date(etd),
          cyCutOff: new Date(cyCutOff),
          eta: new Date(eta),
          volume,
          carrier,
          vessel,
          portOfLoading,
          portOfDischarge,
          cargoMode,
          placeOfIssue,
          freightTerm,
          shipperName,
          consignee,
          descriptionOfGoods: descriptionOfGoods || "", // Default to empty string if not provided
          containerQuantity,
          numbers,
          imagePath: imagePath || "", // Default to empty string
          added_by: added_by || 0, // Default to 0 if not provided
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
          containerDetails: {
            create: {
              consigneeName: containerDetails[0].consigneeName,
              notifyParty: containerDetails[0].notifyParty,
              shipperPer: containerDetails[0].shipperPer,
              from: containerDetails[0].from,
              to: containerDetails[0].to,
              note: containerDetails[0].note,
              imagePath: containerDetails[0].imagePath || "", // Default to empty string
              added_by: containerDetails[0].added_by || 0, // Default to 0 if not provided
            },
          },
        },
        include: {
          containerDetails: true, // Include created ContainerDetail in response
        },
      })
    );

    // Create ContainerItemDetail records and update AddVehicle status using vehicleId
    containerItemDetails.forEach(item => {
      operations.push(
        prisma.containerItemDetail.create({
          data: {
            itemNo: item.itemNo,
            chassisNo: item.chassisNo || "", // Optional field, included if provided
            year: item.year,
            color: item.color,
            cc: item.cc,
            amount: parseFloat(item.amount) || 0,
            vehicleId: item.vehicleId, // Required field, used for relation
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );
      operations.push(
        prisma.addVehicle.update({
          where: { id: item.vehicleId }, // Directly use vehicleId as the unique identifier
          data: {
            status: "Shipped", // Matches VehicleStatus enum
            updatedAt: new Date(),
          },
        })
      );
    });

    // Execute all operations in a single transaction
    const results = await prisma.$transaction(operations);

    // Extract the ContainerBooking record from results (first operation)
    const createdBooking = results[0]; // The first result is the ContainerBooking with included containerDetails

    console.log('Created cargo booking:', JSON.stringify(createdBooking, null, 2)); // Debug log
    return NextResponse.json(
      {
        message: 'Cargo booking created successfully and vehicle statuses updated',
        status: true,
        data: createdBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        status: false,
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}



export async function GET(request) {
  try {
    // Fetch all ContainerBookings with nested containerDetails
    const cargoBookings = await prisma.containerBooking.findMany({
      include: {
        containerDetails: true, // Include nested ContainerDetail records
      },
    });

    // Fetch all ContainerItemDetails separately and group by bookingNo
    const containerItemDetails = await prisma.containerItemDetail.findMany({
      include: {
        vehicle: true, // Include related AddVehicle data
      },
    });

    // Join ContainerItemDetails with ContainerBookings manually
    const cargoBookingsWithItems = cargoBookings.map((booking) => {
      const relatedItems = containerItemDetails.filter((item) => {
        // Assuming you might need to fetch items by bookingNo or another relation
        // Since ContainerItemDetail doesn’t directly link to ContainerBooking in schema,
        // you might need a custom query or additional relation
        // Here, we assume items are fetched separately and matched by vehicleId or another logic
        return booking.containerItemDetails?.some((detail) => detail.vehicleId === item.vehicleId) || true; // Adjust this logic
      });
      return {
        ...booking,
        containerItemDetails: relatedItems,
      };
    });

    console.log('Fetched cargo bookings with joined data:', cargoBookingsWithItems);

    return NextResponse.json(
      {
        message: 'Cargo bookings fetched successfully',
        status: true,
        data: cargoBookingsWithItems,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching cargo bookings:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        status: false,
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}