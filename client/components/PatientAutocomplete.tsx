"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Card, CardBody } from "@heroui/react";
import { Search, User } from "lucide-react";
import { patientsAPI } from "@/lib/api";
import { Patient } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

interface PatientAutocompleteProps {
  value: string;
  onSelect: (patient: Patient) => void;
  placeholder?: string;
  label?: string;
  isRequired?: boolean;
  errorMessage?: string;
}

export default function PatientAutocomplete({
  value,
  onSelect,
  placeholder = "Hasta ara...",
  label = "Hasta Seç",
  isRequired = false,
  errorMessage = ""
}: PatientAutocompleteProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPatientSelected, setIsPatientSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2 && !isPatientSelected) {
        searchPatients(searchTerm.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isPatientSelected]);

  const searchPatients = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await patientsAPI.search(query, 10);
      console.log("Patient Search API Response:", response.data);
      setSuggestions(response.data || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Error searching patients:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsPatientSelected(false); // Reset selection state when user types
  };

  const handlePatientSelect = (patient: Patient) => {
    console.log("Selected patient:", patient);
    const firstName = patient.firstName || patient.first_name || "";
    const lastName = patient.lastName || patient.last_name || "";
    const tcNumber = patient.tcNumber || patient.tc_number || "";
    const displayName = `${firstName} ${lastName} (TC: ${tcNumber})`;
    console.log("Display name:", displayName);
    setSearchTerm(displayName);
    setShowSuggestions(false);
    setSuggestions([]); // Clear suggestions to prevent "not found" message
    setSelectedIndex(-1);
    setIsPatientSelected(true); // Mark as patient selected
    onSelect(patient);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handlePatientSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      // Don't clear suggestions immediately to prevent flicker
    }, 200);
  };

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        startContent={<Search size={16} className="text-gray-400" />}
        isRequired={isRequired}
        errorMessage={errorMessage}
        description={searchTerm.length < 2 ? "En az 2 karakter girin" : ""}
      />

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardBody className="p-0">
            {suggestions.map((patient, index) => {
              const firstName = patient.firstName || patient.first_name || "";
              const lastName = patient.lastName || patient.last_name || "";
              const tcNumber = patient.tcNumber || patient.tc_number || "";
              const age = patient.age || calculateAge(patient.dateOfBirth || patient.date_of_birth || "");
              
              return (
                <div
                  key={patient.patient_id || patient._id}
                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    index === selectedIndex ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {firstName} {lastName}
                        </p>
                        {age > 0 && (
                          <span className="text-xs text-gray-500">
                            {age} yaş
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>TC: {tcNumber}</span>
                        {patient.phone && (
                          <span>{patient.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {showSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && !isLoading && !isPatientSelected && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardBody className="p-4 text-center text-gray-500">
            Hasta bulunamadı
          </CardBody>
        </Card>
      )}
    </div>
  );
}