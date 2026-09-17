"use client";

import * as React from "react";
import Image from "next/image";
import {
  Sparkles,
  UploadCloud,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  Tv,
  Layers,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import {
  UploadSlideDialog,
  EditSlideDialog,
} from "@/components/admin/slideshow-dialogs";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import { HeroSlide } from "@/lib/mock-data";

export default function AdminSlideshowPage() {
  const {
    heroSlides,
    addHeroSlide,
    updateHeroSlide,
    toggleHeroSlideActive,
    deleteHeroSlide,
    reorderHeroSlides,
  } = useAdminData();
  const { toast } = useToast();

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<HeroSlide | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<HeroSlide | null>(null);
  const [previewOpacity, setPreviewOpacity] = React.useState(25);

  const activeSlidesCount = heroSlides.filter((s) => s.is_active).length;

  const handleUpload = async (slideData: any) => {
    await addHeroSlide(slideData);
    toast({
      title: "Slide Added to Home Page",
      description: "Photo published to the background slideshow successfully.",
    });
  };

  const handleToggleActive = (slide: HeroSlide) => {
    toggleHeroSlideActive(slide.id);
    toast({
      title: slide.is_active ? "Slide Hidden" : "Slide Activated",
      description: `"${slide.title || "Photo"}" is now ${
        slide.is_active ? "removed from" : "active in"
      } the home background rotation.`,
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newSlides = [...heroSlides];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    reorderHeroSlides(newSlides);
    toast({
      title: "Slideshow Order Updated",
      description: "Rotation sequence updated across all devices.",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const targetTitle = deleteTarget.title || "Photo";
    setDeleteTarget(null);
    deleteHeroSlide(targetId);
    toast({
      title: "Photo Removed",
      description: `"${targetTitle}" deleted from slideshow.`,
      type: "warning",
    });
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <Tv className="h-3.5 w-3.5 text-neutral-400" /> Public Site Background Slideshow
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Slideshow <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Curator</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Upload, order, enable/disable, and curate stage photography that displays as a subtle background slideshow on the public pages with reduced opacity for high text legibility.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shrink-0"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload New Photo</span>
        </Button>
      </div>

      {/* Stats and Info Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-300">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-100 font-mono">
                {heroSlides.length}
              </div>
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Total Photos
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-100 font-mono">
                {activeSlidesCount}
              </div>
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Active in Rotation
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-300">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-100 font-mono">
                70%
              </div>
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Subtle Opacity
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Visual Simulation Preview */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-neutral-300" />
              <CardTitle className="text-sm font-bold text-neutral-100">
                Live Contrast &amp; Foreground Text Verification
              </CardTitle>
            </div>
            <span className="text-[11px] text-neutral-400">
              Simulating live public site styling
            </span>
          </div>
          <CardDescription className="text-xs text-neutral-400">
            Background photos are rendered with subtle opacity and deep dark vignette overlays to ensure foreground text and buttons remain 100% sharp and readable.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 relative overflow-hidden min-h-[220px] flex items-center justify-center text-center bg-[#080808]">
          {/* Simulated Background Slide */}
          {heroSlides.length > 0 && (
            <div className="absolute inset-0 opacity-70 pointer-events-none">
              <img
                src={heroSlides[0].image_url}
                alt="Simulation"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Contrast overlays */}
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808] opacity-90 pointer-events-none" />

          {/* Foreground Text Preview */}
          <div className="relative z-10 max-w-xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.05] text-neutral-300 text-[10px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 animate-pulse" />
              <span>MALHAR – The Cultural Society of Mirai</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 leading-tight">
              The Rhythm &amp; Creative Pulse of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
                Mirai School of Technology
              </span>
            </h3>
            <p className="text-xs text-neutral-300 max-w-md mx-auto">
              From dance and singing to management and tech, we give students the stage to build skills and showcase their talent.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Slideshow Manager Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-neutral-400" />
            <span>Manage Background Photos ({heroSlides.length})</span>
          </h2>
          <span className="text-xs text-neutral-400">
            Use arrows to reorder slideshow sequence
          </span>
        </div>

        {heroSlides.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel border border-white/[0.06] bg-[#0D0D0D]/75 space-y-3">
            <ImageIcon className="h-12 w-12 mx-auto text-neutral-600" />
            <h3 className="text-base font-bold text-neutral-100">No Slides in Rotation</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Upload horizontal fest or stage photography to enable the dynamic background slideshow on the public website.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
            >
              Upload First Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroSlides.map((slide, index) => (
              <Card
                key={slide.id}
                className={`glass-panel border transition-all duration-200 overflow-hidden flex flex-col justify-between rounded-3xl shadow-xl ${
                  slide.is_active
                    ? "border-white/[0.06] bg-[#0D0D0D]/75 hover:border-white/15"
                    : "border-white/[0.03] bg-[#0D0D0D]/40 opacity-60 hover:opacity-100"
                }`}
              >
                <div>
                  {/* Photo Preview Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                    <img
                      src={slide.image_url}
                      alt={slide.title || "Slide"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Simulated Dark Backdrop Overlay */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Order & Status Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black/80 border border-white/10 text-neutral-200 backdrop-blur-md">
                        #{index + 1}
                      </span>
                      <Badge
                        variant={slide.is_active ? "ongoing" : "completed"}
                        className="text-[10px] capitalize shadow-md backdrop-blur-md border-white/10"
                      >
                        {slide.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    {/* Reorder Buttons on Top Right */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/80 p-1 rounded-full border border-white/10 backdrop-blur-md">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                        className="h-6 w-6 p-0 text-neutral-300 hover:text-white rounded-full disabled:opacity-30"
                        title="Move Earlier in Slideshow"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === heroSlides.length - 1}
                        onClick={() => handleMove(index, "down")}
                        className="h-6 w-6 p-0 text-neutral-300 hover:text-white rounded-full disabled:opacity-30"
                        title="Move Later in Slideshow"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Slide Info */}
                  <CardHeader className="p-3.5 pb-2">
                    <CardTitle className="text-xs font-semibold text-neutral-200 truncate">
                      {slide.title || `Photo #${index + 1}`}
                    </CardTitle>
                    {slide.caption && (
                      <CardDescription className="text-[11px] text-neutral-400 truncate">
                        {slide.caption}
                      </CardDescription>
                    )}
                  </CardHeader>
                </div>

                {/* Card Actions */}
                <div className="p-3.5 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(slide)}
                    className="flex-1 h-8 text-[11px] font-semibold rounded-full border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07]"
                  >
                    {slide.is_active ? (
                      <>
                        <EyeOff className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                        <span>Disable</span>
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                        <span>Activate</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditTarget(slide)}
                      className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05] rounded-full"
                      title="Edit Details"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(slide)}
                      className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-full"
                      title="Delete Slide"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>


      {/* Dialogs */}
      <UploadSlideDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
        currentSlideCount={heroSlides.length}
      />

      <EditSlideDialog
        slide={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSave={(id, updates) => {
          updateHeroSlide(id, updates);
          toast({
            title: "Slide Updated",
            description: "Slide details saved successfully.",
          });
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Background Photo?"
        description={`Are you sure you want to delete "${
          deleteTarget?.title || "this photo"
        }" from the home page slideshow? This action cannot be undone.`}
      />
    </div>
  );
}
