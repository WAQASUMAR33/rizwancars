import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request, {params}){
    const {id} = params;
    const user = await prisma.users.findUnique({where: {id:parseInt(id)}});
    if(!user){
        return NextResponse.json({error: "User not found"}, {status: 404});
    }
    return NextResponse.json(user.balance, {status: 200});
}