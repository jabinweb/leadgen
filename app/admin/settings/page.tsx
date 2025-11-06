import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure global application settings
        </p>
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              defaultValue="LeadGen Platform"
              placeholder="Enter application name"
            />
          </div>

          <div>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              placeholder="support@example.com"
            />
          </div>

          <div>
            <Label htmlFor="maxUsersPerOrg">Max Users Per Organization</Label>
            <Input
              id="maxUsersPerOrg"
              type="number"
              defaultValue="10"
              placeholder="10"
            />
          </div>

          <div>
            <Label htmlFor="defaultPlan">Default Plan for New Users</Label>
            <Input id="defaultPlan" defaultValue="free" placeholder="free" />
          </div>

          <Button className="w-full md:w-auto">Save Settings</Button>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input id="smtpHost" placeholder="smtp.example.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input id="smtpPort" type="number" defaultValue="587" />
            </div>
            <div>
              <Label htmlFor="smtpUser">SMTP User</Label>
              <Input id="smtpUser" placeholder="user@example.com" />
            </div>
          </div>

          <div>
            <Label htmlFor="emailFrom">Default From Email</Label>
            <Input
              id="emailFrom"
              type="email"
              placeholder="noreply@example.com"
            />
          </div>

          <Button className="w-full md:w-auto">Update Email Settings</Button>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
            <Input id="rateLimit" type="number" defaultValue="60" />
          </div>

          <div>
            <Label htmlFor="maxApiKeys">Max API Keys Per User</Label>
            <Input id="maxApiKeys" type="number" defaultValue="3" />
          </div>

          <Button className="w-full md:w-auto">Update API Settings</Button>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Enable maintenance mode to prevent users from accessing the
            application while you perform updates.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="outline">Enable Maintenance Mode</Button>
            <Button variant="destructive">Clear All Caches</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
