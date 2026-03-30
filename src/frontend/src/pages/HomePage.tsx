import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Home, Leaf, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const soilTypes = [
  {
    name: "Red Soil",
    image: "/assets/generated/soil-red.dim_300x200.jpg",
    tag: "Good for farming",
    description:
      "Red soil is formed by weathering of crystalline rocks. It is rich in iron oxide which gives it the red color. Well-drained and suitable for dry farming.",
    crops: ["Groundnut", "Cotton", "Millet", "Tobacco"],
    areas: ["Deccan Plateau", "Eastern Ghats", "Southern India"],
  },
  {
    name: "Black Soil",
    image: "/assets/generated/soil-black.dim_300x200.jpg",
    tag: "High water retention",
    description:
      "Black soil, also called Regur, is ideal for cotton cultivation. It is rich in calcium carbonate, magnesium, potash, and lime. Swells when wet and cracks when dry.",
    crops: ["Cotton", "Soybean", "Wheat", "Sugarcane"],
    areas: ["Maharashtra", "Madhya Pradesh", "Gujarat"],
  },
  {
    name: "Sandy Soil",
    image: "/assets/generated/soil-sandy.dim_300x200.jpg",
    tag: "Low water retention",
    description:
      "Sandy soil has large particles with good drainage. It warms up quickly in spring and is easy to cultivate. Low in nutrients but fast-draining.",
    crops: ["Peanuts", "Watermelon", "Carrots", "Potatoes"],
    areas: ["Rajasthan", "Coastal areas", "Desert regions"],
  },
  {
    name: "Clay Soil",
    image: "/assets/generated/soil-clay.dim_300x200.jpg",
    tag: "Dense & nutrient-rich",
    description:
      "Clay soil is heavy, slow-draining, and holds nutrients well. It is sticky when wet and hard when dry. Excellent for growing certain crops with proper management.",
    crops: ["Rice", "Wheat", "Vegetables", "Flowers"],
    areas: ["Indo-Gangetic Plains", "River deltas", "Low-lying areas"],
  },
  {
    name: "Loamy Soil",
    image: "/assets/generated/soil-loamy.dim_300x200.jpg",
    tag: "Best for most crops",
    description:
      "Loamy soil is a balanced mixture of sand, silt, and clay. It is the most fertile soil type, retaining moisture while draining excess water. Ideal for most agricultural purposes.",
    crops: ["Wheat", "Maize", "Vegetables", "Fruits"],
    areas: ["Punjab", "Haryana", "Uttar Pradesh", "Most agricultural zones"],
  },
];

type SoilType = (typeof soilTypes)[number];

export function HomePage() {
  const [selectedSoil, setSelectedSoil] = useState<SoilType | null>(null);
  const [rating, setRating] = useState(0);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for your feedback!");
    setFeedbackName("");
    setFeedbackText("");
    setRating(0);
  };

  return (
    <main>
      {/* Hero */}
      <section
        className="relative min-h-[85vh] flex items-center"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-land-broker.dim_1400x700.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        data-ocid="hero.section"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-primary font-semibold text-sm tracking-widest uppercase mb-4"
            >
              Professional Land Brokerage
            </motion.p>
            <h1 className="font-serif font-bold text-white text-5xl lg:text-6xl leading-tight mb-6">
              Find Your Perfect
              <span className="block text-amber-300">Piece of Land</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
              Browse agricultural, residential, and commercial land listings
              across the country. Expert brokers ready to guide you.
            </p>
          </motion.div>

          {/* Card graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:flex justify-center items-center"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-5">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <div className="font-serif font-bold text-white text-3xl mb-1">
                FOR SALE
              </div>
              <div className="text-amber-300 font-semibold text-sm tracking-widest uppercase mb-4">
                Prime Land Available
              </div>
              <div className="space-y-2 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Open Plots
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Ventures
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" /> Independent Houses
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Soil Types */}
      <section className="bg-background py-16" data-ocid="soil_types.section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">
              Land Knowledge
            </p>
            <h2 className="font-serif font-bold text-foreground text-3xl">
              Soil Types
            </h2>
            <p className="text-muted-foreground mt-2">
              Understand the soil on your land. Click a card to learn more.
            </p>
          </motion.div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
            {soilTypes.map((soil, i) => (
              <motion.button
                key={soil.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                type="button"
                onClick={() => setSelectedSoil(soil)}
                className="min-w-[180px] max-w-[180px] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-card border border-border text-left cursor-pointer group"
                data-ocid={`soil_types.item.${i + 1}`}
              >
                <div className="h-28 overflow-hidden">
                  <img
                    src={soil.image}
                    alt={soil.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <div className="font-serif font-bold text-foreground text-sm mb-1">
                    {soil.name}
                  </div>
                  <span className="inline-block text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {soil.tag}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Soil Detail Dialog */}
      <Dialog open={!!selectedSoil} onOpenChange={() => setSelectedSoil(null)}>
        <DialogContent className="max-w-md" data-ocid="soil_types.dialog">
          {selectedSoil && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">
                  {selectedSoil.name}
                </DialogTitle>
              </DialogHeader>
              <div className="rounded-lg overflow-hidden mb-4">
                <img
                  src={selectedSoil.image}
                  alt={selectedSoil.name}
                  className="w-full h-40 object-cover"
                />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {selectedSoil.description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-foreground text-sm mb-2">
                    Suitable Crops
                  </div>
                  <ul className="space-y-1">
                    {selectedSoil.crops.map((crop) => (
                      <li
                        key={crop}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        {crop}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm mb-2">
                    Common Areas
                  </div>
                  <ul className="space-y-1">
                    {selectedSoil.areas.map((area) => (
                      <li
                        key={area}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Section */}
      <section className="bg-navy py-20" data-ocid="feedback.section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-3">
                Your Voice Matters
              </p>
              <h2 className="font-serif font-bold text-white text-4xl mb-5">
                We'd Love Your Feedback
              </h2>
              <p className="text-white/70 text-lg leading-relaxed">
                Help us make Land Linkers better for everyone. Share your
                experience, suggest features, or let us know what you love about
                the platform.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Tell us what features you'd like to see",
                  "Report any issues or bugs you found",
                  "Share your overall experience with us",
                ].map((hint) => (
                  <div key={hint} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-white/70 text-sm">{hint}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="font-serif font-bold text-foreground text-2xl mb-6">
                Share Your Feedback
              </h3>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="feedback-name"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Your Name
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    data-ocid="feedback.input"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="feedback-text"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback-text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you think..."
                    rows={4}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    data-ocid="feedback.textarea"
                    required
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground mb-2">
                    Rating
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors ${
                          star <= rating
                            ? "text-amber-400"
                            : "text-muted-foreground/30 hover:text-amber-300"
                        }`}
                        data-ocid="feedback.toggle"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                  data-ocid="feedback.submit_button"
                >
                  Submit Feedback
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
