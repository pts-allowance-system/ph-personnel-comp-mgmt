"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Rule } from "@/lib/types"

export default function EditRulePage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const { token } = useAuthStore()

  const [rule, setRule] = useState<Rule | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [conditions, setConditions] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id && token) {
      const fetchRule = async () => {
        try {
          const response = await fetch(`/api/admin/rules/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!response.ok) throw new Error("Failed to fetch rule")
          const data = await response.json()
          setRule(data.rule)
          setName(data.rule.name)
          setDescription(data.rule.description)
          setConditions(JSON.stringify(data.rule.conditions, null, 2))
          setIsActive(data.rule.isActive)
        } catch (err: any) {
          setError(err.message)
        }
      }
      fetchRule()
    }
  }, [id, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let parsedConditions
      try {
        parsedConditions = JSON.parse(conditions)
      } catch (jsonError) {
        throw new Error("Invalid JSON in conditions field.")
      }

      const response = await fetch(`/api/admin/rules/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, conditions: parsedConditions, isActive }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update rule")
      }

      router.push("/admin/rules")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!rule) {
    return <div className="flex justify-center p-8">Loading rule data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Rule</h1>
        <p className="text-gray-600">Update rule details and conditions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule Information</CardTitle>
          <CardDescription>Edit the details for {rule.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions (JSON format)</Label>
              <Textarea
                id="conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                rows={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setIsActive(value === "true")} value={String(isActive)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
