import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function POST(request) {
    try {
      const data = await request.json();
  
      // Validate required fields
      const requiredFields = ["admin_id", "vehicleNo", "date", "sale_price"];
      for (const field of requiredFields) {
        if (!data[field]) {
          return NextResponse.json(
            { message: `Missing required field: ${field}`, error: true },
            { status: 400 }
          );
        }
      }
  
      // Ensure admin exists
      const admin = await prisma.admin.findUnique({
        where: { id: data.admin_id },
      });
      if (!admin) {
        return NextResponse.json(
          { message: "Admin not found", error: true },
          { status: 404 }
        );
      }
  
      // Ensure vehicle exists and is not already sold
      const vehicle = await prisma.vehicle.findUnique({
        where: { vehicleNo: data.vehicleNo },
      });
      if (!vehicle) {
        return NextResponse.json(
          { message: `Vehicle with vehicleNo ${data.vehicleNo} not found`, error: true },
          { status: 404 }
        );
      }
      if (vehicle.status === "Sold") {
        return NextResponse.json(
          { message: `Vehicle ${data.vehicleNo} is already sold`, error: true },
          { status: 400 }
        );
      }
  
      // Use a transaction to ensure both operations succeed or fail together
      const [saleVehicle] = await prisma.$transaction([
        // Create the sale vehicle record
        prisma.sale_Vehicle.create({
          data: {
            admin_id: data.admin_id,
            vehicleNo: data.vehicleNo,
            date: new Date(data.date),
            commission_amount: data.commission_amount || 0,
            othercharges: data.othercharges || 0,
            totalAmount: data.totalAmount || 0,
            mobileno: data.mobileno || "",
            passportNo: data.passportNo || "",
            fullname: data.fullname || "",
            details: data.details || "",
            sale_price: data.sale_price,
            imagePath: data.imagePath || "",
          },
        }),
        // Update the vehicle status to "Sold"
        prisma.vehicle.update({
          where: { vehicleNo: data.vehicleNo },
          data: { status: "Sold" },
        }),
      ]);
  
      return NextResponse.json(
        {
          message: "Sale vehicle saved successfully and vehicle status updated to Sold",
          data: saleVehicle,
          error: false,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error saving sale vehicle:", error);
      return NextResponse.json(
        { message: "Failed to save sale vehicle", error: true },
        { status: 500 }
      );
    }
  }

  export async function GET(request) {
    try {
        // Fetch all sale vehicles
        const saleVehicles = await prisma.sale_Vehicle.findMany({
            orderBy: { createdAt: 'desc' }, // Optional: latest first
        });

        return NextResponse.json(
            {
                message: "Sale vehicles retrieved successfully",
                data: saleVehicles,
                error: false,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch sale vehicles", error: true },
            { status: 500 }
        );
    }
}