'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(loginData.username, loginData.password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password || !registerData.name) {
      setError('Please fill in all fields');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await register(registerData.username, registerData.password, registerData.name);
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
              <Heart className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Tracker</h1>
          <p className="text-gray-600">
            Track your health journey with personalized insights
          </p>
        </div>

        <Card className="border-none shadow-lg backdrop-blur-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-base">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-base">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-sm font-medium text-gray-700">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      disabled={isLoading}
                      className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      disabled={isLoading}
                      className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transform transition-transform hover:scale-105" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-medium text-gray-700">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      disabled={isLoading}
                      className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-sm font-medium text-gray-700">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username (min 3 chars)"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      disabled={isLoading}
                      className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium text-gray-700">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Choose a password (min 4 chars)"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      disabled={isLoading}
                      className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      disabled={isLoading}
                      className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transform transition-transform hover:scale-105" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 shadow-sm">
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
