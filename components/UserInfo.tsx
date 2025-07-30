'use client';

import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';

interface UserInfoProps {
  onLogout: () => void;
}

export default function UserInfo({ onLogout }: UserInfoProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center">
            <User size={16} className="mr-2" />
            Current User
          </div>
          <Button size="sm" variant="outline" onClick={onLogout}>
            <LogOut size={14} className="mr-1" />
            Logout
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-gray-500">@{user.username}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
