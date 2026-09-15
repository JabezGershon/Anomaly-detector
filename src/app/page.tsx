"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface LedgerRow {
  ACCTDESCR?: string;
  ACCOUNT: string;
  POSTED_TOTAL_AMT: number;
  Category: string;
  Previous_AMOUNT?: number;
}

export default function GLAnalyzer() {
  const [data, setData] = useState<LedgerRow[] | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [glBalance, setGlBalance] = useState<number | null>(null);
  const [trialBalance, setTrialBalance] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterAccount, setFilterAccount] = useState<string>("All");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      if (!target?.result) return;
      const wb = XLSX.read(target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      let jsonData: LedgerRow[] = XLSX.utils.sheet_to_json(ws).map((row: any) => ({
        ACCTDESCR: row.ACCTDESCR,
        ACCOUNT: String(row.ACCOUNT).trim(),
        POSTED_TOTAL_AMT: parseFloat(row.POSTED_TOTAL_AMT) || 0,
        Category: categorize(row.ACCTDESCR),
        Previous_AMOUNT: parseFloat(row.Previous_AMOUNT) || 0,
      }));
      analyzeData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  const categorize = (descr?: string): string => {
    const categories = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"];
    return categories.find((cat) => descr?.toLowerCase().includes(cat.toLowerCase())) || "Unclassified";
  };

  const analyzeData = (jsonData: LedgerRow[]) => {
    const categoryTotals: Record<string, number> = {};
    let totalBalance = 0;
    jsonData.forEach((row) => {
      categoryTotals[row.Category] = (categoryTotals[row.Category] || 0) + row.POSTED_TOTAL_AMT;
      totalBalance += row.POSTED_TOTAL_AMT;
    });
    setSummary(categoryTotals);
    setGlBalance(totalBalance);
    setData(jsonData);
  };

  const filteredSortedData = () => {
    if (!data) return [];
    let filtered = [...data];

    if (filterCategory !== "All") {
      filtered = filtered.filter((row) => row.Category === filterCategory);
    }
    if (filterAccount !== "All") {
      filtered = filtered.filter((row) => row.ACCOUNT === filterAccount);
    }

    if (sortKey) {
      filtered.sort((a, b) => {
        if (sortKey === "POSTED_TOTAL_AMT" || sortKey === "Previous_AMOUNT") {
          return sortOrder === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
        }
        return sortOrder === "asc"
          ? String(a[sortKey]).localeCompare(String(b[sortKey]))
          : String(b[sortKey]).localeCompare(String(a[sortKey]));
      });
    }
    return filtered;
  };

  useEffect(() => {
    if (data) {
      let filtered = data;
      if (filterCategory !== "All") {
        filtered = filtered.filter((row) => row.Category === filterCategory);
      }
      if (filterAccount !== "All") {
        filtered = filtered.filter((row) => row.ACCOUNT === filterAccount);
      }
      setTrialBalance(filtered.reduce((sum, row) => sum + row.POSTED_TOTAL_AMT, 0));
    }
  }, [filterCategory, filterAccount, data]);

  return (
    <div className="p-8 text-center">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">
        General Ledger Analyzer
      </motion.h1>
      <input type="file" accept=".csv,.xlsx" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="my-4" />
      <div className="my-4">
        <p><strong>GL Balance:</strong> ${glBalance?.toLocaleString() || 0}</p>
        <p><strong>Trial Balance:</strong> ${trialBalance?.toLocaleString() || 0}</p>
      </div>
      <div className="my-4">
        <label>Filter by Category: </label>
        <select onChange={(e) => setFilterCategory(e.target.value)} value={filterCategory}>
          <option value="All">All</option>
          {Object.keys(summary).map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <label className="ml-4">Filter by Account: </label>
        <select onChange={(e) => setFilterAccount(e.target.value)} value={filterAccount}>
          <option value="All">All</option>
          {[...new Set(data?.map(row => String(row.ACCOUNT).trim()))].map((account) => (
            <option key={account} value={account}>{account}</option>
          ))}
        </select>
      </div>
      <table className="w-full mt-4 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2" onClick={() => setSortKey("Category")}>Category</th>
            <th className="border border-gray-300 px-4 py-2" onClick={() => setSortKey("ACCOUNT")}>Account</th>
            <th className="border border-gray-300 px-4 py-2" onClick={() => setSortKey("POSTED_TOTAL_AMT")}>Amount ($)</th>
          </tr>
        </thead>
        <tbody>
          {filteredSortedData().map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-600">{row.Category}</td>
              <td className="border border-gray-300 px-4 py-2">{row.ACCOUNT}</td>
              <td className="border border-gray-300 px-4 py-2 text-red-500">${row.POSTED_TOTAL_AMT.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
