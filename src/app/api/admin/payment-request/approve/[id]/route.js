import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET method - Retrieve a payment request by ID
export async function GET(request, { params }) {
  try {
    const id = params.id;

    // Fetch the payment request by ID from the database
    const paymentRequest = await prisma.paymentRequests.findUnique({
      where: { id: parseInt(id, 10) },
    });

    // If the payment request doesn't exist
    if (!paymentRequest) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      );
    }

    // Return the found payment request
    return NextResponse.json(paymentRequest, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment request:", error);

    // Return an error response
    return NextResponse.json(
      { error: "Failed to fetch payment request" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
    try {
      const data = await request.json();
      const id = params.id;
  
      // Validate input data
      if (!id || !data || Object.keys(data).length === 0) {
        return NextResponse.json({ message: "Invalid payload", error: true }, { status: 400 });
      }
  
      // Fetch the existing payment request
      const paymentRequest = await prisma.paymentRequests.findUnique({
        where: { id: parseInt(id, 10) },
      });
  
      if (!paymentRequest) {
        return NextResponse.json({ message: "Payment request not found", error: true }, { status: 404 });
      }
  
      // Check if already approved
      if (paymentRequest.status === "Approved") {
        return NextResponse.json(
          { message: "Payment is already approved", error: true },
          { status: 400 }
        );
      }
  
      const user = await prisma.users.findUnique({
        where: { id: paymentRequest.userid },
      });
  
      if (!user) {
        return NextResponse.json({ message: "User not found", error: true }, { status: 404 });
      }
  
      const newAmount = user.balance + paymentRequest.amount;
  
      // Update user's balance
      await prisma.users.update({
        where: { id: paymentRequest.userid },
        data: { balance: newAmount },
      });
  
      // Update the payment request
      const updatedRequest = await prisma.paymentRequests.update({
        where: { id: parseInt(id, 10) },
        data: {
          transactionno: data.transactionno,
          img_url: data.img_url,
          status: data.status,
          verified_by: data.verified_by,
          amount: data.amount,
        },
      });
  
      
        console.log("Ledger record is going to create");
        console.log("data",user.id,data.amount,newAmount,data.transactionno)
        // Create the ledger record with updated balance
        const newrecord = await prisma.NewLedger.create({
          data: {
            agent_id: parseInt(user.id), // Correct user ID
            amount_in: parseFloat(data.amount),
            amount_out: parseFloat(0),
            balance: parseFloat(newAmount>0 ? newAmount : 0),
            description: 'Payment Request is approved',
            type: 'payment-request',
            payment_request_id: parseInt(data.id),
          },
        }).catch(error => {
            console.error("Error creating ledger record:", error);
            throw new Error("Failed to create ledger record");
          });

          const notification = await prisma.Notifications.create({
            data: {
              user_id: parseInt(user.id), // Correct user ID
              message: "Your payment request has been approved",
              status: "sent"
            },
          }).catch(error => {
            console.error("Error creating ledger record:", error);
            throw new Error("Failed to create ledger record");
          });
                  
  
        // if (!newrecord) {
        //   return NextResponse.json(
        //     { message: "Failed to create ledger record", error: true },
        //     { status: 500 }
        //   );
        // }
      
  
      return NextResponse.json(
        {
          message: `Payment request ${data.status.toLowerCase()} successfully`,
          data: updatedRequest,
          error: false,
        },
        { status: 200 }
      );
    } catch (error) {
    //   console.error("Error updating payment request:", error);
  
      return NextResponse.json(
        { message: "Failed to update payment request", error: true },
        { status: 500 }
      );
    }
  }
  
  
// DELETE method - Delete a payment request by ID
export async function DELETE(request, { params }) {
  try {
    const id = params.id;

    const response = await prisma.paymentRequests.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      { message: "Payment request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payment request:", error);

    return NextResponse.json(
      { error: "Failed to delete payment request" },
      { status: 500 }
    );
  }
}
