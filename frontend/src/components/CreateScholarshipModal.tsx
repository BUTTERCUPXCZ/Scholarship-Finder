import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createScholar } from "../services/createScholar";
import { useAuth } from "../AuthProvider/AuthProvider";
import toast from "react-hot-toast";
import {
  type ScholarshipFormData,
  organizationTypes,
  validateScholarshipForm,
} from "../schemas/scholarshipSchema";
import { Loader2, Calendar } from "lucide-react";

interface CreateScholarshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateScholarshipModal = ({
  isOpen,
  onClose,
}: CreateScholarshipModalProps) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const [formData, setFormData] = useState<ScholarshipFormData>({
    title: "",
    organizationType: "",
    description: "",
    eligibilityRequirements: "",
    location: "",
    benefits: "",
    deadline: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ScholarshipFormData, string>>
  >({});

  const createScholarshipMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return createScholar(data, token || undefined);
    },
    onSuccess: () => {
      toast.success("Scholarship created successfully!");
      // Invalidate and refetch both org and public scholarship lists
      queryClient.invalidateQueries({
        queryKey: ["organization-scholarships"],
      });
      queryClient.invalidateQueries({ queryKey: ["scholarships"] });
      handleClose();
    },
    onError: (error) => {
      toast.error("Failed to create scholarship. Please try again.");
      console.error("Error creating scholarship:", error);
    },
  });

  const handleClose = () => {
    setFormData({
      title: "",
      organizationType: "",
      description: "",
      eligibilityRequirements: "",
      location: "",
      benefits: "",
      deadline: "",
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ScholarshipFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const result = validateScholarshipForm(formData);
    setErrors(result.errors);
    return result.success;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    const scholarData = {
      title: formData.title,
      type: formData.organizationType,
      description: formData.description,
      location: formData.location,
      requirements: formData.eligibilityRequirements,
      benefits: formData.benefits,
      deadline: formData.deadline,
    };

    createScholarshipMutation.mutate(scholarData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="-full max-w-[900px] sm:max-w-[800px] max-h-[85vh] overflow-auto border border-gray-200 rounded-xl bg-white">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Create New Scholarship
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Fill in the details to create a new scholarship opportunity for
            students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700"
                >
                  Scholarship Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter scholarship title"
                  className={`rounded-xl ${errors.title ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="organizationType"
                  className="text-sm font-medium text-gray-700"
                >
                  Organization Type *
                </Label>
                <Select
                  value={formData.organizationType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      organizationType: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className={`rounded-xl ${errors.organizationType ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 w-full"}`}
                  >
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.organizationType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.organizationType}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide a detailed description of the scholarship..."
                rows={4}
                className={`rounded-xl ${errors.description ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Requirements and Details Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Requirements & Details
              </h3>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="eligibilityRequirements"
                className="text-sm font-medium text-gray-700"
              >
                Eligibility Requirements *
              </Label>
              <Textarea
                id="eligibilityRequirements"
                name="eligibilityRequirements"
                value={formData.eligibilityRequirements}
                onChange={handleInputChange}
                placeholder="Enter each requirement"
                rows={4}
                className={`rounded-xl ${errors.eligibilityRequirements ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
              />
              {errors.eligibilityRequirements && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.eligibilityRequirements}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-sm font-medium text-gray-700"
                >
                  Location *
                </Label>
                <div className="relative">
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Davao, Philippines"
                    className={`ounded-xl ${errors.location ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
                  />
                </div>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="deadline"
                  className="text-sm font-medium text-gray-700"
                >
                  Application Deadline *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className={`pl-10 rounded-xl ${errors.deadline ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
                  />
                </div>
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="benefits"
                className="text-sm font-medium text-gray-700"
              >
                Benefits & Value *
              </Label>
              <div className="relative">
                <Textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  placeholder="List benefits one per line (e.g., Tuition waiver, Monthly stipend)."
                  rows={3}
                  className={`rounded-xl ${errors.benefits ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"}`}
                />
              </div>
              {errors.benefits && (
                <p className="mt-1 text-sm text-red-600">{errors.benefits}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createScholarshipMutation.isPending}
              className="border-gray-200 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createScholarshipMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {createScholarshipMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Scholarship"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScholarshipModal;
