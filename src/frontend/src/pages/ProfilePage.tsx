import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function ProfilePage() {
  const { userType } = useAuth();

  // Agent fields
  const [agentName, setAgentName] = useState("Arjun Mehta");
  const [agentContact, setAgentContact] = useState("+91 98765 43210");
  const [agencyName, setAgencyName] = useState("Land Linkers Realty");
  const [experience, setExperience] = useState("4");
  const [bio, setBio] = useState(
    "Specialised in residential plots and agricultural land across Telangana.",
  );

  // Owner fields
  const [ownerName, setOwnerName] = useState("Ramesh Reddy");
  const [ownerContact, setOwnerContact] = useState("+91 94400 12345");
  const [ownerAddress, setOwnerAddress] = useState("Bangalore, Karnataka");
  const [idNumber, setIdNumber] = useState("AABPR1234C");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile saved successfully!");
  };

  const isAgent = userType === "agent";

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl text-foreground">
                {isAgent ? "Agent Profile" : "Owner Profile"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isAgent
                  ? "Manage your agent details and bio"
                  : "Manage your owner details"}
              </p>
            </div>
          </div>

          <Card data-ocid="profile.card">
            <CardHeader>
              <CardTitle className="font-serif text-lg text-foreground">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                {isAgent ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="agent-name">Full Name</Label>
                      <Input
                        id="agent-name"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="Your full name"
                        data-ocid="profile.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="agent-contact">Email / Mobile</Label>
                      <Input
                        id="agent-contact"
                        value={agentContact}
                        onChange={(e) => setAgentContact(e.target.value)}
                        placeholder="email@example.com or mobile"
                        data-ocid="profile.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="agency-name">Agency Name</Label>
                      <Input
                        id="agency-name"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="Your agency or firm name"
                        data-ocid="profile.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="Years of experience"
                        data-ocid="profile.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="A short description about yourself"
                        rows={3}
                        data-ocid="profile.textarea"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="owner-name">Full Name</Label>
                      <Input
                        id="owner-name"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Your full name"
                        data-ocid="profile.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="owner-contact">Email / Mobile</Label>
                      <Input
                        id="owner-contact"
                        value={ownerContact}
                        onChange={(e) => setOwnerContact(e.target.value)}
                        placeholder="email@example.com or mobile"
                        data-ocid="profile.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="owner-address">Address</Label>
                      <Input
                        id="owner-address"
                        value={ownerAddress}
                        onChange={(e) => setOwnerAddress(e.target.value)}
                        placeholder="Your city / address"
                        data-ocid="profile.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="id-number">
                        ID Number (PAN / Aadhar)
                      </Label>
                      <Input
                        id="id-number"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="e.g. AABPR1234C"
                        data-ocid="profile.input"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  data-ocid="profile.save_button"
                >
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
