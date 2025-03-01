// app/api/admin/inspection-management/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received data:', data); // Log incoming data for debugging

    const {
      date,
      company,
      imagePath,
      added_by,
      createdAt,
      updatedAt,
      vehicles,
    } = data;

    // Validation for required fields
    if (!date || !company || !vehicles || !added_by || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    // Prepare an array of Prisma operations
    const operations = [];

    // Add create operations for each Inspection record
    vehicles.forEach(vehicle => {
      operations.push(
        prisma.inspection.create({
          data: {
            vehicleNo: vehicle.chassisNo, // Changed from vehicleNo to match input
            company,
            date: new Date(date),
            amount: parseFloat(vehicle.amount), // Changed from fee to amount, Float type
            imagePath: imagePath || "",
            added_by,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
        })
      );
      // Add update operation for each AddVehicle status
      operations.push(
        prisma.addVehicle.update({
          where: { id: vehicle.id },
          data: {
            status: "Inspection", // Update to "Inspection"
            updatedAt: new Date(),
          },
        })
      );
    });

    // Execute all operations in a single transaction
    const results = await prisma.$transaction(operations);

    // Filter out only the Inspection records from the results
    const createdInspections = results.filter(result => result.hasOwnProperty('vehicleNo')); // Inspection records have 'vehicleNo'

    return NextResponse.json(
      {
        message: 'Inspections created successfully and vehicle statuses updated',
        status: true,
        data: createdInspections,
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
    console.log("Fetching inspections from API...");
    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Join with AddVehicle based on vehicleNo matching chassisNo
    const inspectionsWithVehicles = await Promise.all(
      inspections.map(async (inspection) => {
        const vehicle = await prisma.addVehicle.findFirst({
          where: {
            chassisNo: inspection.vehicleNo,
          },
        });

        return {
          ...inspection,
          vehicle: vehicle || null, // Include vehicle data or null if not found
        };
      })
    );

    console.log("Fetched inspections with vehicles:", inspectionsWithVehicles);

    return NextResponse.json(
      {
        message: "Inspections fetched successfully",
        status: true,
        data: inspectionsWithVehicles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        status: false,
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

