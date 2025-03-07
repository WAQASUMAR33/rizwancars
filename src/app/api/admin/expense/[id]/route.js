// app/api/admin/expenses/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../utils/prisma";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    console.log("Received data for update:", JSON.stringify(data, null, 2));

    const { user_id, expense_title, expense_description, amount, added_by } = data;

    // Validation for required fields
    if (!user_id || !expense_title || amount === undefined || !added_by) {
      return NextResponse.json(
        { error: "Missing required fields", status: false },
        { status: 400 }
      );
    }

    const updatedExpense = await prisma.expenses.update({
      where: { id: parseInt(id) },
      data: {
        user_id: parseInt(user_id),
        expense_title,
        expense_description: expense_description || "",
        amount: parseFloat(amount),
        added_by: parseInt(added_by),
        updatedAt: new Date(),
      },
    });

    console.log("Updated expense:", updatedExpense);
    return NextResponse.json(
      { message: "Expense updated successfully", status: true, data: updatedExpense },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating expense:", error.stack || error);
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await prisma.expenses.delete({
      where: { id: parseInt(id) },
    });

    console.log("Deleted expense with id:", id);
    return NextResponse.json(
      { message: "Expense deleted successfully", status: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting expense:", error.stack || error);
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}