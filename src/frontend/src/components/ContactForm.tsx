import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitInquiry } from "../hooks/useQueries";

interface ContactFormProps {
  prefillMessage?: string;
  prefillPropertyId?: bigint;
}

export function ContactForm({
  prefillMessage,
  prefillPropertyId,
}: ContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: prefillMessage ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const submitMutation = useSubmitInquiry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        timestamp: BigInt(Date.now()),
        propertyId: prefillPropertyId,
      });
      setSubmitted(true);
      toast.success(
        "Your inquiry has been sent! A broker will contact you shortly.",
      );
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12" data-ocid="contact.success_state">
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="font-serif font-bold text-foreground text-2xl mb-2">
          Message Sent!
        </h3>
        <p className="text-muted-foreground">
          A land specialist will reach out to you within 24 hours.
        </p>
        <Button
          variant="outline"
          className="mt-6 border-primary text-primary hover:bg-primary hover:text-white"
          onClick={() => setSubmitted(false)}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-ocid="contact.modal"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="contact-name"
            className="text-sm font-medium mb-1.5 block"
          >
            Full Name *
          </Label>
          <Input
            id="contact-name"
            placeholder="John Smith"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            data-ocid="contact.name.input"
          />
        </div>
        <div>
          <Label
            htmlFor="contact-email"
            className="text-sm font-medium mb-1.5 block"
          >
            Email Address *
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            required
            data-ocid="contact.email.input"
          />
        </div>
      </div>

      <div>
        <Label
          htmlFor="contact-phone"
          className="text-sm font-medium mb-1.5 block"
        >
          Phone Number
        </Label>
        <Input
          id="contact-phone"
          type="tel"
          placeholder="(555) 000-0000"
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
          data-ocid="contact.phone.input"
        />
      </div>

      <div>
        <Label
          htmlFor="contact-message"
          className="text-sm font-medium mb-1.5 block"
        >
          Message *
        </Label>
        <Textarea
          id="contact-message"
          placeholder="Tell us about the land you're looking for, your budget, preferred location, and any other details..."
          value={form.message}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, message: e.target.value }))
          }
          rows={5}
          required
          data-ocid="contact.message.textarea"
        />
      </div>

      <Button
        type="submit"
        disabled={submitMutation.isPending}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 text-base"
        data-ocid="contact.submit_button"
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
          </>
        ) : (
          "Send Inquiry"
        )}
      </Button>
    </form>
  );
}
