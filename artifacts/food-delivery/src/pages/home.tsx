import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetDeliveryRestaurants } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { getCuisineEmoji } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Search, Star, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const CUISINES = ["All", "American", "Italian", "Japanese", "Indian", "Mexican", "Chinese", "Thai", "Healthy", "Dessert"];

export default function Home() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useGetDeliveryRestaurants(
    { 
      search: debouncedSearch || undefined, 
      cuisine: selectedCuisine !== "All" ? selectedCuisine : undefined 
    },
    { request: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const restaurants = data?.data || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      <main className="pt-24 md:pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 md:p-12 relative overflow-hidden border border-primary/10">
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground tracking-tight mb-4">
                What are you <br/> craving today?
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Get the best food from top restaurants delivered fast.
              </p>
              
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-6 h-6 text-muted-foreground" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for restaurants or dishes..." 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border-2 border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-lg shadow-black/5 text-lg font-medium transition-all outline-none"
                />
              </div>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute right-40 -bottom-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {CUISINES.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`snap-start whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-200 border-2 ${
                  selectedCuisine === cuisine 
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/25 translate-y-[-2px]" 
                    : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-secondary/50"
                }`}
              >
                {cuisine !== "All" && <span className="text-lg">{getCuisineEmoji(cuisine)}</span>}
                {cuisine}
              </button>
            ))}
          </div>
        </section>

        {/* Restaurant Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {selectedCuisine !== "All" ? `${selectedCuisine} Restaurants` : "Popular Near You"}
            </h2>
            <span className="text-muted-foreground font-medium">{restaurants.length} places</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse bg-card rounded-3xl h-64 border border-border" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <p className="font-semibold">Failed to load restaurants. Please try again later.</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex w-24 h-24 bg-secondary rounded-full items-center justify-center mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">No restaurants found</h3>
              <p className="text-muted-foreground mt-2">Try changing your search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant, idx) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/restaurant/${restaurant.id}`} className="block group">
                    <div className="bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                      <div className="h-48 bg-secondary relative overflow-hidden flex items-center justify-center">
                        {/* Placeholder image using gradient and emoji since backend might not have real images */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/20 group-hover:scale-105 transition-transform duration-500" />
                        <span className="text-7xl relative z-10 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                          {getCuisineEmoji(restaurant.cuisine)}
                        </span>
                        {!restaurant.isActive && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                            <span className="bg-card text-foreground px-4 py-2 rounded-full font-bold shadow-sm">Currently Closed</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{restaurant.name}</h3>
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-sm font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {restaurant.rating || "New"}
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground text-sm flex items-center gap-1 mb-4">
                          <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium text-secondary-foreground">{restaurant.cuisine}</span>
                          <span className="mx-1">•</span>
                          <span className="truncate">{restaurant.address}</span>
                        </p>
                        
                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> 20-35 min
                          </div>
                          <div>
                            {restaurant.totalOrders}+ orders
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
