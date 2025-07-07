import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">ปฏิเสธการเข้าถึง</CardTitle>
          <CardDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            โปรดติดต่อผู้ดูแลระบบหากคุณเชื่อว่านี่เป็นข้อผิดพลาด
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">กลับไปที่หน้าเข้าสู่ระบบ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
