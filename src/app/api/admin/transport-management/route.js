// app/api/transport/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received data:', data); // Log incoming data for debugging

    const {
      date,
      deliveryDate,
      port,
      company,
      fee,
      imagePath,
      added_by,
      createdAt,
      updatedAt,
      vehicles,
    } = data;

    // Validation for required fields
    if (!date || !deliveryDate || !port || !company || !vehicles || !added_by || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    // Prepare an array of Prisma operations
    const operations = [];

    // Add create operations for each Transport record
    vehicles.forEach(vehicle => {
      operations.push(
        prisma.transport.create({
          data: {
            date: new Date(date),
            deliveryDate: new Date(deliveryDate),
            port,
            company,
            added_by,
            fee: parseFloat(vehicle.fee),
            imagePath: imagePath || "",
            vehicleNo: vehicle.chassisNo,
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
            status: "Transport",
            updatedAt: new Date(),
          },
        })
      );
    });

    // Execute all operations in a single transaction
    const results = await prisma.$transaction(operations);

    // Filter out only the Transport records from the results
    const createdTransports = results.filter(result => result.hasOwnProperty('port')); // Transport records have 'port'

    console.log('Created transports:', createdTransports); // Debug log
    return NextResponse.json(
      {
        message: 'Transports created successfully and vehicle statuses updated',
        status: true,
        data: createdTransports,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating transports:', error);
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
      console.log("Fetching transports from API...");
      // Fetch all Transport records
      const transports = await prisma.transport.findMany({
        orderBy: { createdAt: "desc" },
      });
  
      // Fetch related AddVehicle data through ContainerItemDetail
      const transportWithVehicles = await Promise.all(
        transports.map(async (transport) => {
          // Assuming vehicleNo corresponds to chassisNo in AddVehicle for this example
          // Adjust this logic based on your actual relation
          const vehicles = await prisma.addVehicle.findMany({
            where: {
              chassisNo: transport.vehicleNo, // Example join condition; adjust as needed
            },
            include: {
              containerItems: true, // Include ContainerItemDetail if needed
            },
          });
  
          return {
            ...transport,
            vehicles: vehicles.length > 0 ? vehicles : [],
          };
        })
      );
  
      console.log("Fetched transports with vehicles:", transportWithVehicles);
  
      return NextResponse.json(
        {
          message: "Transports fetched successfully",
          status: true,
          data: transportWithVehicles,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error fetching transports:", error);
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