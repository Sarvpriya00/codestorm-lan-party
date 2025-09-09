import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-6xl font-bold text-primary mb-2">404</CardTitle>
          <p className="text-xl text-muted-foreground">Page Not Found</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded">
            {location.pathname}
          </p>
          <div className="flex gap-2 justify-center pt-4">
            <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button asChild className="flex items-center gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
