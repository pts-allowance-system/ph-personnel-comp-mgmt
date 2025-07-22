"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit } from "lucide-react"

export default function RulesPage() {
  const { token } = useAuthStore()
  const { rules, fetchRules, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (token) {
      fetchRules()
    }
    return () => clearData()
  }, [token, fetchRules, clearData])

  if (loading) {
    return <div className="flex justify-center p-8">Loading rules...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Rules</h1>
          <p className="text-gray-600">Manage business rules for the allowance system</p>
        </div>
        <Button asChild>
          <Link href="/admin/rules/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configured Rules</CardTitle>
          <CardDescription>A list of all business rules in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.description}</TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/rules/${rule.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rules.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No rules found. Get started by adding a new rule.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
