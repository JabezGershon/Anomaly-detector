"use client";
import * as React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="border p-4 rounded-lg shadow">{children}</div>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-2">{children}</div>;
}
