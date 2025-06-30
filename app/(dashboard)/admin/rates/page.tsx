"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useDataStore } from "@/lib/data-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatToThb } from "@/lib/currency-utils"

export default function RatesPage() {
  const { user, token } = useAuthStore()
  const { rates, fetchRates, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchRates(token)
    }

    return () => {
      clearData()
    }
  }, [token, user, fetchRates, clearData])

  if (loading) {
    return <div className="flex justify-center p-8">Loading rates...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Allowance Rates</h1>
        <p className="text-gray-600">View and manage allowance rates for different groups and tiers</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rate Configuration</CardTitle>
          <CardDescription>A list of all allowance rates currently in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No rates found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{rate.group}</TableCell>
                    <TableCell>{rate.tier}</TableCell>
                    <TableCell>{formatToThb(rate.baseRate)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
