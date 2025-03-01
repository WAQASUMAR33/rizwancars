import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';


// GET request to fetch all bookings
export async function GET(request,{params}) {
    const id = params.id
    console.log("id",id);
  try {
    const bookings = await prisma.paymentRequests.findMany({where:{
        userid: parseInt(id)
    },
  }); // Corrected typo in `packageBookings`
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch bookings',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
