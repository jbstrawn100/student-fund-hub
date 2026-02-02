import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const AVAILABLE_FIELDS = [
  { id: "student_full_name", label: "Full Name", alwaysRequired: true },
  { id: "student_email", label: "Email", alwaysRequired: true },
  { id: "student_phone", label: "Phone Number", alwaysRequired: false },
  { id: "requested_amount", label: "Requested Amount", alwaysRequired: true },
  { id: "intended_use_category", label: "Use Category", alwaysRequired: true },
  { id: "intended_use_description", label: "Use Description", alwaysRequired: false },
  { id: "justification_paragraph", label: "Justification", alwaysRequired: false },
  { id: "attachments", label: "File Attachments", alwaysRequired: false }
];

export default function FieldSelector({ selectedFields, onFieldsChange }) {
  const toggleField = (fieldId) => {
    const existing = selectedFields.find(f => f.id === fieldId);
    
    if (existing) {
      // If field is always required, don't allow removal
      const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fieldId);
      if (fieldDef.alwaysRequired) return;
      
      // Remove field
      onFieldsChange(selectedFields.filter(f => f.id !== fieldId));
    } else {
      // Add field
      const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fieldId);
      onFieldsChange([...selectedFields, { 
        id: fieldId, 
        label: fieldDef.label,
        required: fieldDef.alwaysRequired 
      }]);
    }
  };

  const toggleRequired = (fieldId) => {
    onFieldsChange(
      selectedFields.map(f => 
        f.id === fieldId ? { ...f, required: !f.required } : f
      )
    );
  };

  const isFieldSelected = (fieldId) => {
    return selectedFields.some(f => f.id === fieldId);
  };

  const isFieldRequired = (fieldId) => {
    const field = selectedFields.find(f => f.id === fieldId);
    return field?.required || false;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Application Fields</CardTitle>
        <CardDescription>Select which fields to show on the application form</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {AVAILABLE_FIELDS.map((field) => {
          const isSelected = isFieldSelected(field.id);
          const isRequired = isFieldRequired(field.id);
          
          return (
            <div
              key={field.id}
              className={`p-3 rounded-lg border transition-colors ${
                isSelected ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200"
              } ${field.alwaysRequired ? "opacity-75" : ""}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleField(field.id)}
                    disabled={field.alwaysRequired}
                    className={field.alwaysRequired ? "cursor-not-allowed" : ""}
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium cursor-pointer">
                      {field.label}
                      {field.alwaysRequired && (
                        <span className="text-xs text-indigo-600 ml-2">(Always included)</span>
                      )}
                    </Label>
                  </div>
                </div>
                
                {isSelected && !field.alwaysRequired && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`req-${field.id}`} className="text-xs text-slate-600 cursor-pointer">
                      Required
                    </Label>
                    <Switch
                      id={`req-${field.id}`}
                      checked={isRequired}
                      onCheckedChange={() => toggleRequired(field.id)}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}