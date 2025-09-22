"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChangeTheme from "@/components/changeTheme";
import { TrendingUp, Bitcoin, Newspaper } from "lucide-react";

interface NavigationHeaderProps {
  currentPage: "stock" | "crypto" | "news";
  onPageChange: (page: "stock" | "crypto" | "news") => void;
}

const NavigationHeader = ({
  currentPage,
  onPageChange,
}: NavigationHeaderProps) => {
  return (
    <div className="bg-gray-50 dark:bg-black">
      {/* Theme Toggle - positioned absolutely */}
      <div className="absolute top-4 right-4 z-10">
        <ChangeTheme />
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Main Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Track stocks, cryptocurrencies, and market news with real-time data
          </p>

          {/* Navigation Tabs */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant={currentPage === "stock" ? "default" : "outline"}
              onClick={() => onPageChange("stock")}
              className="flex items-center gap-2 px-6 py-2"
            >
              <TrendingUp className="w-4 h-4" />
              Stock Market
              {currentPage === "stock" && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>

            <Button
              variant={currentPage === "crypto" ? "default" : "outline"}
              onClick={() => onPageChange("crypto")}
              className="flex items-center gap-2 px-6 py-2"
            >
              <Bitcoin className="w-4 h-4" />
              Cryptocurrencies
              {currentPage === "crypto" && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>

            {/* <Button
              variant={currentPage === "news" ? "default" : "outline"}
              onClick={() => onPageChange("news")}
              className="flex items-center gap-2 px-6 py-2"
            >
              <Newspaper className="w-4 h-4" />
              Market News
              {currentPage === "news" && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;
