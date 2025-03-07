// app/api/admin/vehicles/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../utils/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.addVehicle.findMany({
      include: {
        distributor: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        seaPort: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        vehicleImages: {
          select: {
            id: true,
            imagePath: true,
          },
        },
      },
    });

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        {
          message: "No vehicles found",
          status: true,
          data: [],
        },
        { status: 200 }
      );
    }

    console.log("Fetched vehicles:", JSON.stringify(vehicles, null, 2));

    return NextResponse.json(
      {
        message: "Vehicles fetched successfully",
        status: true,
        data: vehicles,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
   
    return NextResponse.json(
      {
        message: "Unexpected server error occurred",
        status: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}