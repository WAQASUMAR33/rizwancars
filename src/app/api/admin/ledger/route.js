import prisma from '@/utils/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ledgerEntries = await prisma.NewLedger.findMany({
      include: {
        Users: true,
        HotelBooking: {
          include: {
            Hotel: true,
            Hoteliers: true,
          },
        },
        FlightBookings: true,
        GroupFlightBookings: {
          include: {
            SingleGroupFlight: true,
            FlightGroups: true,
            FlightSector: true,
            FlightAirline: true,
            GroupPassengers: true,
            Users: true,
          },
        },
        PaymentRequests: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    return NextResponse.json(ledgerEntries);
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch ledger entries',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
