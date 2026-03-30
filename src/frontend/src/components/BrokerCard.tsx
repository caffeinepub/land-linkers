import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import type { BrokerProfile } from "../backend.d";

interface BrokerCardProps {
  broker: BrokerProfile;
  index: number;
  onContact: (broker: BrokerProfile) => void;
}

const INITIALS_COLORS = ["bg-navy", "bg-primary", "bg-amber-700"];

export function BrokerCard({ broker, index, onContact }: BrokerCardProps) {
  const initials = broker.name
    .split(" ")
    .map((n) => n[0])
    .join("");
  const bgColor = INITIALS_COLORS[index % INITIALS_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card rounded-xl p-6 border border-border shadow-sm text-center hover:shadow-md transition-shadow"
      data-ocid={`broker.item.${index + 1}`}
    >
      {/* Photo */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        {broker.photoUrl ? (
          <img
            src={broker.photoUrl}
            alt={broker.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-border shadow"
          />
        ) : (
          <div
            className={`w-24 h-24 rounded-full ${bgColor} flex items-center justify-center border-4 border-border shadow`}
          >
            <span className="text-white font-serif font-bold text-2xl">
              {initials}
            </span>
          </div>
        )}
      </div>

      <h3 className="font-serif font-bold text-foreground text-xl mb-1">
        {broker.name}
      </h3>
      <p className="text-primary font-semibold text-sm mb-3">{broker.title}</p>
      <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-3">
        {broker.bio}
      </p>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-5">
        {broker.phone && (
          <div className="flex items-center justify-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span>{broker.phone}</span>
          </div>
        )}
        {broker.email && (
          <div className="flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{broker.email}</span>
          </div>
        )}
      </div>

      <Button
        onClick={() => onContact(broker)}
        variant="outline"
        className="w-full border-primary text-primary hover:bg-primary hover:text-white font-semibold"
        data-ocid={`broker.contact.button.${index + 1}`}
      >
        Contact {broker.name.split(" ")[0]}
      </Button>
    </motion.div>
  );
}
