import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Settings, Users, Trophy, Calendar } from "lucide-react";

export function ContestManagement() {
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await apiClient.get("/contests");
        setContests(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Failed to fetch contests:", error);
        setContests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contest Management</h1>
        <Button>Create Contest</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Contests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No contests available
          </div>
        </CardContent>
      </Card>
    </div>
  );
}