import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Group,
  Image as KonvaImage,
  Text as KonvaText,
} from 'react-konva';
import type Konva from 'konva';
import {
  ArrowRight,
  ArrowLeft,
  Printer,
  Sliders,
  Calendar,
  Smile,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Check,
  Upload,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { TEMPLATES, STICKER_PRESETS } from '../data/templates';
import { FILTER_LIST, applyFilterToCanvas } from '../utils/filters';
import { generateTemplateOverlaySvg } from '../utils/templateGenerator';
import type { FilterType, StampFont, StickerItem } from '../types/photobooth';

function useFilteredImage(url: string | undefined, filter: FilterType) {
  const [element, setElement] = useState<HTMLCanvasElement | HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) return;

    let isMounted = true;
    const img = new window.Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'Anonymous';
    }
    img.src = url;

    img.onload = () => {
      if (!isMounted) return;
      if (filter === 'normal') {
        setElement(img);
      } else {
        const filtered = applyFilterToCanvas(img, filter);
        setElement(filtered);
      }
    };

    img.onerror = () => {
      if (!isMounted) return;
      console.warn('Failed to load image for filter:', url);
    };

    return () => {
      isMounted = false;
    };
  }, [url, filter]);

  return url ? element : null;
}

function useSimpleImage(url: string | undefined | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) return;

    let isMounted = true;
    const img = new window.Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'Anonymous';
    }
    img.src = url;
    img.onload = () => {
      if (isMounted) setImage(img);
    };

    return () => {
      isMounted = false;
    };
  }, [url]);

  return url ? image : null;
}

interface SlotPhotoProps {
  slot: { id: number; x: number; y: number; width: number; height: number; borderRadius: number };
  photo: { dataUrl: string; filter: FilterType; x: number; y: number; scale: number };
  isSelected: boolean;
  onSelect: () => void;
  onUpdatePosition: (x: number, y: number) => void;
}

const SlotPhotoItem: React.FC<SlotPhotoProps> = ({
  slot,
  photo,
  isSelected,
  onSelect,
  onUpdatePosition,
}) => {
  const filteredImg = useFilteredImage(photo?.dataUrl, photo?.filter || 'normal');

  const rawWidth = (filteredImg as HTMLImageElement)?.naturalWidth || filteredImg?.width || 800;
  const rawHeight = (filteredImg as HTMLImageElement)?.naturalHeight || filteredImg?.height || 600;
  const imgWidth = Math.max(1, rawWidth);
  const imgHeight = Math.max(1, rawHeight);

  // Minimum scale needed to cover slot dimensions completely
  const scaleCover = Math.max(slot.width / imgWidth, slot.height / imgHeight);
  // Ensure photo.scale is at least 1.0 (so it never zooms out smaller than slot)
  const currentScaleMultiplier = Math.max(1, photo?.scale || 1);
  const totalScale = scaleCover * currentScaleMultiplier;

  const currentWidth = imgWidth * totalScale;
  const currentHeight = imgHeight * totalScale;

  const baseOffsetX = (currentWidth - slot.width) / 2;
  const baseOffsetY = (currentHeight - slot.height) / 2;

  // Maximum allowed pan so photo never reveals whitespace/transparent gaps
  // The image is placed at group-relative coords (imgX, imgY)
  // For the image to cover [0, 0, slot.width, slot.height]:
  // imgX <= 0, and imgX + currentWidth >= slot.width  =>  slot.width - currentWidth <= imgX <= 0
  const minGroupX = slot.width - currentWidth;
  const maxGroupX = 0;
  const minGroupY = slot.height - currentHeight;
  const maxGroupY = 0;

  // Clamped initial / current group-relative position
  const rawGroupX = -baseOffsetX + (photo?.x || 0);
  const rawGroupY = -baseOffsetY + (photo?.y || 0);
  const currentGroupX = Math.min(maxGroupX, Math.max(minGroupX, rawGroupX));
  const currentGroupY = Math.min(maxGroupY, Math.max(minGroupY, rawGroupY));

  return (
    <Group
      x={slot.x}
      y={slot.y}
      onClick={onSelect}
      onTap={onSelect}
      clipFunc={(ctx) => {
        const r = slot.borderRadius || 0;
        const w = slot.width;
        const h = slot.height;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
      }}
    >
      <Rect width={slot.width} height={slot.height} fill="#F5F5F4" />

      {filteredImg && (
        <KonvaImage
          image={filteredImg}
          x={currentGroupX}
          y={currentGroupY}
          width={currentWidth}
          height={currentHeight}
          draggable
          dragBoundFunc={(pos) => {
            // Absolute canvas coordinates
            const clampedAbsX = Math.min(slot.x + maxGroupX, Math.max(slot.x + minGroupX, pos.x));
            const clampedAbsY = Math.min(slot.y + maxGroupY, Math.max(slot.y + minGroupY, pos.y));
            return { x: clampedAbsX, y: clampedAbsY };
          }}
          onDragEnd={(e) => {
            const clampedRelX = Math.min(maxGroupX, Math.max(minGroupX, e.target.x()));
            const clampedRelY = Math.min(maxGroupY, Math.max(minGroupY, e.target.y()));
            e.target.position({ x: clampedRelX, y: clampedRelY });
            const newX = clampedRelX + baseOffsetX;
            const newY = clampedRelY + baseOffsetY;
            onUpdatePosition(newX, newY);
          }}
        />
      )}

      {isSelected && (
        <Rect
          width={slot.width}
          height={slot.height}
          stroke="#FF6B81"
          strokeWidth={3}
          cornerRadius={slot.borderRadius}
          listening={false}
        />
      )}
    </Group>
  );
};

const KonvaStickerItem: React.FC<{
  sticker: StickerItem;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (x: number, y: number) => void;
}> = ({ sticker, isSelected, onSelect, onUpdate }) => {
  const customImg = useSimpleImage(sticker.imageUrl);

  return (
    <Group
      x={sticker.x}
      y={sticker.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onUpdate(e.target.x(), e.target.y());
      }}
    >
      {sticker.imageUrl && customImg ? (
        <KonvaImage
          image={customImg}
          width={80 * sticker.scale}
          height={80 * sticker.scale}
          offsetX={(80 * sticker.scale) / 2}
          offsetY={(80 * sticker.scale) / 2}
          rotation={sticker.rotation}
        />
      ) : (
        <KonvaText
          text={sticker.emoji}
          fontSize={38 * sticker.scale}
          offsetX={(38 * sticker.scale) / 2}
          offsetY={(38 * sticker.scale) / 2}
          rotation={sticker.rotation}
          align="center"
          verticalAlign="middle"
        />
      )}

      {isSelected && (
        <Rect
          x={-(46 * sticker.scale)}
          y={-(46 * sticker.scale)}
          width={92 * sticker.scale}
          height={92 * sticker.scale}
          stroke="#FF6B81"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
};

export const EditorScreen: React.FC = () => {
  const {
    selectedLayoutId,
    selectedTemplateId,
    customOverlayUrl,
    photos,
    updatePhoto,
    setGlobalFilter,
    dateStamp,
    setDateStamp,
    stickers,
    addSticker,
    updateSticker,
    removeSticker,
    setFinalImage,
    setStep,
  } = useBooth();

  const layout = LAYOUTS[selectedLayoutId];
  const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'filter' | 'zoom' | 'date' | 'stickers'>('filter');
  const [applyAllFilters, setApplyAllFilters] = useState<boolean>(true);

  const [previewScale, setPreviewScale] = useState<number>(0.35);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableHeight = window.innerHeight - 200;
        const availableWidth = containerRef.current.clientWidth - 120; // Allow side room for floating indicator
        const scaleH = availableHeight / layout.height;
        const scaleW = availableWidth / layout.width;
        setPreviewScale(Math.min(scaleH, scaleW, 0.44));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [layout.width, layout.height]);

  const overlaySvgUrl = useMemo(
    () => generateTemplateOverlaySvg(layout, template),
    [layout, template]
  );
  const overlaySvgImage = useSimpleImage(overlaySvgUrl);
  const customOverlayImage = useSimpleImage(customOverlayUrl);

  const selectedPhoto = photos.find(p => p.slotIndex === selectedSlotIndex) || photos[0];
  const selectedSlot = layout.slots.find(s => s.id === selectedSlotIndex) || layout.slots[0];
  const selectedSticker = stickers.find(s => s.id === selectedStickerId) || null;

  const handleProceedToDownload = () => {
    if (stageRef.current) {
      try {
        // High-res export at 2x: exactly 2 * layout.width by 2 * layout.height with NO outer margin!
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        setFinalImage(dataUrl);
        setStep('download');
      } catch (err) {
        console.warn('High-res export failed, falling back to pixelRatio 1:', err);
        try {
          const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1 });
          setFinalImage(dataUrl);
          setStep('download');
        } catch (e) {
          console.error('Canvas export error:', e);
        }
      }
    }
  };

  const handleFilterSelect = (filterId: FilterType) => {
    if (applyAllFilters) {
      setGlobalFilter(filterId);
    } else {
      updatePhoto(selectedSlotIndex, { filter: filterId });
    }
  };

  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png')) {
      alert('Please select a transparent PNG image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        const newSticker: StickerItem = {
          id: `sticker-png-${Date.now()}`,
          emoji: '',
          imageUrl: dataUrl,
          x: layout.width / 2,
          y: layout.height / 2,
          scale: 1,
          rotation: 0,
        };
        // Add sticker via context
        stickers.push(newSticker);
        setSelectedStickerId(newSticker.id);
        // Force update through context sticker list
        updateSticker(newSticker.id, { x: newSticker.x });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectNextFrame = () => {
    setSelectedSlotIndex(prev => (prev + 1) % layout.slots.length);
  };

  const handleSelectPrevFrame = () => {
    setSelectedSlotIndex(prev => (prev - 1 + layout.slots.length) % layout.slots.length);
  };

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <button
            onClick={() => setStep('review')}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 mb-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Review</span>
          </button>
          <h2 className="text-2xl font-fredoka font-semibold text-stone-900">
            Studio Editor
          </h2>
        </div>

        <button
          onClick={handleProceedToDownload}
          className="soft-btn-coral text-sm px-6 py-2.5 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Photostrip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Photostrip Canvas Preview */}
        <div
          ref={containerRef}
          className="lg:col-span-7 bg-stone-50 border border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[520px] overflow-hidden relative"
        >
          <div className="text-[11px] text-stone-400 mb-3">
            Click frame to select • Drag photo to adjust crop • Drag stickers to place
          </div>

          {/* Konva Stage Container with Scale Transform */}
          <div className="relative flex items-center justify-center">
            {/* The Scaled Stage Wrapper */}
            <div
              className="rounded-xl overflow-hidden bg-white border border-stone-200"
              style={{
                width: layout.width * previewScale,
                height: layout.height * previewScale,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                  width: layout.width,
                  height: layout.height,
                }}
              >
                <Stage
                  ref={stageRef}
                  width={layout.width}
                  height={layout.height}
                >
                  {/* LAYER 1: Background & Photos */}
                  <Layer>
                    <Rect
                      width={layout.width}
                      height={layout.height}
                      fill={template.backgroundColor}
                    />

                    {layout.slots.map((slot) => {
                      const photo = photos.find(p => p.slotIndex === slot.id) || {
                        id: `p-${slot.id}`,
                        slotIndex: slot.id,
                        dataUrl: '',
                        filter: 'normal' as FilterType,
                        x: 0,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        originalWidth: 800,
                        originalHeight: 600,
                      };

                      return (
                        <SlotPhotoItem
                          key={slot.id}
                          slot={slot}
                          photo={photo}
                          isSelected={selectedSlotIndex === slot.id}
                          onSelect={() => setSelectedSlotIndex(slot.id)}
                          onUpdatePosition={(x, y) => updatePhoto(slot.id, { x, y })}
                        />
                      );
                    })}
                  </Layer>

                  {/* LAYER 2: Template Overlay Borders & Cutouts */}
                  <Layer listening={false}>
                    {layout.slots.map((slot) => (
                      <Rect
                        key={`border-${slot.id}`}
                        x={slot.x}
                        y={slot.y}
                        width={slot.width}
                        height={slot.height}
                        stroke={template.borderColor}
                        strokeWidth={1.5}
                        cornerRadius={slot.borderRadius}
                      />
                    ))}

                    {overlaySvgImage && (
                      <KonvaImage
                        image={overlaySvgImage}
                        width={layout.width}
                        height={layout.height}
                      />
                    )}

                    {customOverlayImage && (
                      <KonvaImage
                        image={customOverlayImage}
                        width={layout.width}
                        height={layout.height}
                      />
                    )}
                  </Layer>

                  {/* LAYER 3: Date Stamp & Draggable Stickers */}
                  <Layer>
                    {dateStamp.enabled && (
                      <KonvaText
                        x={0}
                        y={layout.height - 28}
                        width={layout.width}
                        text={dateStamp.customText}
                        fontFamily={dateStamp.font}
                        fontSize={14}
                        fontStyle="bold"
                        fill={dateStamp.color}
                        align="center"
                      />
                    )}

                    {stickers.map((sticker) => (
                      <KonvaStickerItem
                        key={sticker.id}
                        sticker={sticker}
                        isSelected={selectedStickerId === sticker.id}
                        onSelect={() => setSelectedStickerId(sticker.id)}
                        onUpdate={(x, y) => updateSticker(sticker.id, { x, y })}
                      />
                    ))}
                  </Layer>
                </Stage>
              </div>
            </div>

            {/* Floating Frame Indicator on the side with alignment line */}
            <div
              className="absolute left-full ml-3 transition-all duration-200 flex items-center gap-1.5 z-20 pointer-events-auto"
              style={{
                top: (selectedSlot.y + selectedSlot.height / 2) * previewScale - 16,
              }}
            >
              {/* Pointer line */}
              <div className="w-4 h-[2px] bg-kiwali-coral" />
              
              {/* Floating Badge */}
              <div className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5 whitespace-nowrap shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-kiwali-coral" />
                <span className="text-xs font-semibold text-stone-800">
                  Frame #{selectedSlotIndex + 1}
                </span>

                {layout.slots.length > 1 && (
                  <div className="flex items-center ml-1 border-l border-stone-200 pl-1 gap-0.5">
                    <button
                      onClick={handleSelectPrevFrame}
                      title="Previous frame"
                      className="p-0.5 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleSelectNextFrame}
                      title="Next frame"
                      className="p-0.5 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Studio Controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 space-y-5">
          {/* Tab Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl">
            {[
              { id: 'filter', label: 'Filters', icon: Sliders },
              { id: 'zoom', label: 'Zoom', icon: ZoomIn },
              { id: 'date', label: 'Stamp', icon: Calendar },
              { id: 'stickers', label: 'Stickers', icon: Smile },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-stone-900 border border-stone-200'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mb-0.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: FILTERS */}
          {activeTab === 'filter' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">Color Grading</span>
                <label className="flex items-center gap-1.5 text-stone-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyAllFilters}
                    onChange={(e) => setApplyAllFilters(e.target.checked)}
                    className="rounded border-stone-300 text-kiwali-coral focus:ring-kiwali-coral"
                  />
                  <span>All frames</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FILTER_LIST.map((f) => {
                  const isCurrent = (selectedPhoto?.filter || 'normal') === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFilterSelect(f.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-kiwali-coral bg-kiwali-soft-pink/40 text-stone-900 font-semibold'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-stone-200"
                          style={{ backgroundColor: f.colorGrade }}
                        />
                        <span>{f.name}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-kiwali-coral" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ZOOM & PAN */}
          {activeTab === 'zoom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">Zoom Frame #{selectedSlotIndex + 1}</span>
                <button
                  onClick={() => updatePhoto(selectedSlotIndex, { x: 0, y: 0, scale: 1 })}
                  className="text-stone-400 hover:text-stone-700 underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-stone-400" />
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.05"
                    value={selectedPhoto?.scale || 1}
                    onChange={(e) => updatePhoto(selectedSlotIndex, { scale: parseFloat(e.target.value) })}
                    className="w-full accent-kiwali-coral cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-stone-400" />
                </div>
                <div className="text-right text-[11px] text-stone-400 font-mono">
                  {Math.round((selectedPhoto?.scale || 1) * 100)}%
                </div>
              </div>

              <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                Auto-snap active: Photo edges automatically lock to frame boundaries so no gaps appear.
              </p>
            </div>
          )}

          {/* TAB 3: DATE STAMP */}
          {activeTab === 'date' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">Date Stamp</span>
                <label className="flex items-center gap-1.5 text-stone-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dateStamp.enabled}
                    onChange={(e) => setDateStamp(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-stone-300 text-kiwali-coral focus:ring-kiwali-coral"
                  />
                  <span>Show on strip</span>
                </label>
              </div>

              {dateStamp.enabled && (
                <>
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      Stamp Text
                    </label>
                    <input
                      type="text"
                      value={dateStamp.customText}
                      onChange={(e) => setDateStamp(prev => ({ ...prev, customText: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-kiwali-coral"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      Typography
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'Space Mono', name: 'Space Mono' },
                        { id: 'Fredoka', name: 'Fredoka' },
                        { id: 'Gaegu', name: 'Gaegu' },
                        { id: 'Plus Jakarta Sans', name: 'Sans' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setDateStamp(prev => ({ ...prev, font: f.id as StampFont }))}
                          className={`p-2 rounded-xl border text-xs text-center cursor-pointer transition-colors ${
                            dateStamp.font === f.id
                              ? 'border-kiwali-coral bg-kiwali-soft-pink/30 font-semibold text-stone-900'
                              : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      {['#1C1917', '#F8FAFC', '#FF6B81', '#F59E0B', '#A855F7'].map(c => (
                        <button
                          key={c}
                          onClick={() => setDateStamp(prev => ({ ...prev, color: c }))}
                          className={`w-6 h-6 rounded-full border border-stone-300 transition-transform ${
                            dateStamp.color === c ? 'scale-125 ring-2 ring-kiwali-coral ring-offset-1' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: STICKERS */}
          {activeTab === 'stickers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">Add Stickers</span>
                {stickers.length > 0 && (
                  <button
                    onClick={() => {
                      stickers.forEach(s => removeSticker(s.id));
                      setSelectedStickerId(null);
                    }}
                    className="text-stone-400 hover:text-red-500 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Upload Custom PNG Sticker Button */}
              <div>
                <button
                  type="button"
                  onClick={() => stickerFileInputRef.current?.click()}
                  className="w-full soft-btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom PNG Sticker</span>
                </button>
                <input
                  ref={stickerFileInputRef}
                  type="file"
                  accept="image/png"
                  onChange={handleCustomStickerUpload}
                  className="hidden"
                />
                <p className="text-[10px] text-stone-400 text-center mt-1">
                  Upload any transparent PNG sticker from your computer
                </p>
              </div>

              {/* Preset sticker icons */}
              <div>
                <span className="block text-[11px] text-stone-500 mb-1.5">Preset Stickers</span>
                <div className="grid grid-cols-6 gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  {STICKER_PRESETS.slice(0, 12).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addSticker(emoji)}
                      className="w-9 h-9 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-lg active:scale-95 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Sticker Controls: Scale / Resize & Delete */}
              {selectedSticker && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-700">
                      Resize Selected Sticker {selectedSticker.emoji}
                    </span>
                    <button
                      onClick={() => {
                        removeSticker(selectedSticker.id);
                        setSelectedStickerId(null);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateSticker(selectedSticker.id, {
                          scale: Math.max(0.4, selectedSticker.scale - 0.2),
                        })
                      }
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 cursor-pointer"
                      title="Smaller"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="range"
                      min="0.4"
                      max="3.0"
                      step="0.1"
                      value={selectedSticker.scale}
                      onChange={(e) =>
                        updateSticker(selectedSticker.id, {
                          scale: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-kiwali-coral cursor-pointer"
                    />

                    <button
                      onClick={() =>
                        updateSticker(selectedSticker.id, {
                          scale: Math.min(3.0, selectedSticker.scale + 0.2),
                        })
                      }
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 cursor-pointer"
                      title="Larger"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[11px] font-mono text-stone-500 w-10 text-right">
                      {Math.round(selectedSticker.scale * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Placed Stickers List */}
              {stickers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stickers.map((s) => (
                    <span
                      key={s.id}
                      onClick={() => setSelectedStickerId(s.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer border ${
                        selectedStickerId === s.id
                          ? 'border-kiwali-coral bg-kiwali-soft-pink/50 text-stone-900 font-semibold'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{s.emoji || 'Custom PNG'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSticker(s.id);
                          if (selectedStickerId === s.id) setSelectedStickerId(null);
                        }}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer text-xs ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
