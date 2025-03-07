// app/api/admin/sea_ports/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

// POST: Create a new sea port
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, location } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Missing required field: name', status: false },
        { status: 400 }
      );
    }

    // Create a new sea port in the database
    const newSeaPort = await prisma.seaPort.create({
      data: {
        name,
        location: location || "", // Optional field, default to empty string if not provided
      },
    });

    return NextResponse.json(
      {
        message: 'Sea port created successfully',
        status: true,
        data: newSeaPort,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating sea port:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create sea port',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET: Fetch all sea ports
export async function GET() {
  try {
    const seaPorts = await prisma.seaPort.findMany({
      orderBy: { createdAt: 'desc' }, // Sort by creation date, newest first
      include: {
        vehicles: true, // Optionally include related vehicles
      },
    });

    return NextResponse.json(
      {
        message: 'Sea ports fetched successfully',
        status: true,
        data: seaPorts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching sea ports:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch sea ports',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}