import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Wrench, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Properties = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-accent/10">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>FixSense</span>
          </Link>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold">Properties</h1>
              <p className="text-muted-foreground">Manage your properties and appliances</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>

          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
                <p className="mb-6">Start by adding your first property to track appliances and maintenance</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Properties;