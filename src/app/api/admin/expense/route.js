// app/api/admin/expenses/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../utils/prisma";

export async function GET() {
  try {
    const expenses = await prisma.expenses.findMany();
    console.log("Fetched expenses:", expenses);
    return NextResponse.json(
      { message: "Expenses fetched successfully", status: true, data: expenses },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching expenses:", error.stack || error);
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    const { user_id, expense_title, expense_description, amount, added_by } = data;

    // Validation for required fields
    if (!user_id || !expense_title || amount === undefined || !added_by) {
      return NextResponse.json(
        { error: "Missing required fields (user_id, expense_title, amount, added_by)", status: false },
        { status: 400 }
      );
    }

    const expense = await prisma.expenses.create({
      data: {
        user_id: parseInt(user_id),
        expense_title,
        expense_description: expense_description || "",
        amount: parseFloat(amount),
        added_by: parseInt(added_by),
      },
    });

    console.log("Created expense:", expense);
    return NextResponse.json(
      { message: "Expense created successfully", status: true, data: expense },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating expense:", error.stack || error);
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}