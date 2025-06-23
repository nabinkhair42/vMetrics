"use client"

import { features } from "./feature";

export function FeatureShowcase() {

  return (
    <section className="py-24">
      <div className="px-4 max-w-5xl mx-auto">
        <div className="space-y-32">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              {/* Title and Description */}
              <h2 className="text-5xl font-bold text-white mb-4">
                {feature.title}
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto mb-12">
                {feature.description}
              </p>

              {/* Gradient Container with Image */}
              <div className="max-w-3xl mx-auto relative rounded-2xl overflow-hidden">
                {/* Gradient Background with Noise */}
                <div className="absolute inset-0">
                  {/* Base gradient */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(135deg, #ff69b4 0%, #4b0082 50%, #228b22 100%)',
                      opacity: '0.6'
                    }}
                  />
                  
                  {/* Noise texture */}
                  <div 
                    className="absolute inset-0 mix-blend-overlay opacity-75"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat',
                      backgroundSize: '100px 100px'
                    }}
                  />
                </div>

                {/* Image */}
                <div className="relative px-8 pt-12 bottom-0">
                  <img
                    src={feature.darkImage}
                    alt={feature.alt}
                    className="rounded-t-2xl w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}