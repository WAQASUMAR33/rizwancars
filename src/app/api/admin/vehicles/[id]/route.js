// app/api/admin/vehicle-details/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../utils/prisma";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) { // Fixed typo: isNaNvehicleId) -> isNaN(vehicleId)
      return NextResponse.json(
        { message: "Invalid vehicle ID", status: false },
        { status: 400 }
      );
    }

    const vehicle = await prisma.addVehicle.findUnique({
      where: { id: vehicleId },
      include: {
        distributor: {
          select: { id: true, name: true, location: true },
        },
        seaPort: {
          select: { id: true, name: true, location: true },
        },
        vehicleImages: {
          select: { id: true, imagePath: true, createdAt: true },
        },
        containerItems: {
          select: {
            id: true,
            itemNo: true,
            chassisNo: true,
            year: true,
            color: true,
            cc: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found", status: false },
        { status: 404 }
      );
    }

    // Fetch related Transport records
    const transports = await prisma.transport.findMany({
      where: { vehicleNo: vehicle.chassisNo },
      select: {
        id: true,
        date: true,
        deliveryDate: true,
        port: true,
        company: true,
        fee: true,
        fee_doller: true,
        imagePath: true,
        vehicleNo: true,
        createdAt: true,
      },
    });

    const detailedVehicle = {
      ...vehicle,
      transports,
    };

    return NextResponse.json(
      {
        message: "Vehicle details fetched successfully",
        status: true,
        data: detailedVehicle,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
  
    return NextResponse.json(
      {
        message: "Unexpected server error occurred",
        status: false,
        error: errorMessage, // Correctly using errorMessage here
      },
      { status: 500 }
    );
  }
}