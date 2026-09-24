import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Group,
  Image as KonvaImage,
  Text as KonvaText,
  Transformer,
} from 'react-konva';
import type Konva from 'konva';
import {
  ArrowRight,
  ArrowLeft,
  Download,
  Sliders,
  Calendar,
  Smile,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Check,
  Upload,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  RotateCw,
  Type
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
  isExporting: boolean;
  onSelect: () => void;
  onUpdatePosition: (x: number, y: number) => void;
}

const SlotPhotoItem: React.FC<SlotPhotoProps> = ({
  slot,
  photo,
  isSelected,
  isExporting,
  onSelect,
  onUpdatePosition,
}) => {
  const filteredImg = useFilteredImage(photo?.dataUrl, photo?.filter || 'normal');

  const rawWidth = (filteredImg as HTMLImageElement)?.naturalWidth || filteredImg?.width || 800;
  const rawHeight = (filteredImg as HTMLImageElement)?.naturalHeight || filteredImg?.height || 600;
  const imgWidth = Math.max(1, rawWidth);
  const imgHeight = Math.max(1, rawHeight);

  // Minimum scale to cover slot
  const scaleCover = Math.max(slot.width / imgWidth, slot.height / imgHeight);
  const currentScaleMultiplier = Math.max(1, photo?.scale || 1);
  const totalScale = scaleCover * currentScaleMultiplier;

  const currentWidth = imgWidth * totalScale;
  const currentHeight = imgHeight * totalScale;

  const baseOffsetX = (currentWidth - slot.width) / 2;
  const baseOffsetY = (currentHeight - slot.height) / 2;

  // Clamping bounds
  const minGroupX = slot.width - currentWidth;
  const maxGroupX = 0;
  const minGroupY = slot.height - currentHeight;
  const maxGroupY = 0;

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

      {/* Selected slot border - STRICTLY hidden during export so it never appears on saved image */}
      {!isExporting && isSelected && (
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
  isExporting: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<StickerItem>) => void;
}> = ({ sticker, isSelected, isExporting, onSelect, onUpdate }) => {
  const customImg = useSimpleImage(sticker.imageUrl);
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Attach Canva-style Transformer when selected
  useEffect(() => {
    if (isSelected && !isExporting && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isExporting]);

  return (
    <>
      <Group
        ref={groupRef}
        x={sticker.x}
        y={sticker.y}
        rotation={sticker.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onUpdate({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          node.scaleX(1);
          node.scaleY(1);
          onUpdate({
            x: node.x(),
            y: node.y(),
            scale: Math.max(0.3, Math.min(3.5, sticker.scale * scaleX)),
            rotation: Math.round(node.rotation()),
          });
        }}
      >
        {sticker.imageUrl && customImg ? (
          <KonvaImage
            image={customImg}
            width={80 * sticker.scale}
            height={80 * sticker.scale}
            offsetX={(80 * sticker.scale) / 2}
            offsetY={(80 * sticker.scale) / 2}
          />
        ) : (
          <KonvaText
            text={sticker.emoji}
            fontSize={38 * sticker.scale}
            offsetX={(38 * sticker.scale) / 2}
            offsetY={(38 * sticker.scale) / 2}
            align="center"
            verticalAlign="middle"
          />
        )}
      </Group>

      {/* Canva-style interactive Transformer: corner resize + rotation stalk */}
      {!isExporting && isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 15 || Math.abs(newBox.height) < 15) {
              return oldBox;
            }
            return newBox;
          }}
          borderStroke="#FF6B81"
          borderDash={[3, 3]}
          anchorStroke="#FF6B81"
          anchorFill="#FFFFFF"
          anchorSize={8}
          anchorCornerRadius={4}
        />
      )}
    </>
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
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [previewScale, setPreviewScale] = useState<number>(0.35);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const isMobile = window.innerWidth < 768;
        // On mobile (stacked layout): cap to 48% of the true viewport height
        // On desktop (side-by-side): use the container's own rendered height
        const availableHeight = isMobile
          ? window.innerHeight * 0.48
          : containerRef.current.clientHeight > 200
            ? containerRef.current.clientHeight - 100
            : window.innerHeight - 280;
        const availableWidth = containerRef.current.clientWidth - 40;
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
  const selectedSticker = stickers.find(s => s.id === selectedStickerId) || null;

  // Save Photostrip with 100% outline clearance guarantee
  const handleProceedToSave = async () => {
    // 1. Clear sticker selection & slot highlight
    setSelectedStickerId(null);
    setIsExporting(true);

    // 2. Wait for React state to flush and Konva layer to redraw cleanly
    await new Promise((resolve) => setTimeout(resolve, 60));

    // 3. Export clean canvas without any transformer or red bounding boxes
    if (stageRef.current) {
      try {
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
    setIsExporting(false);
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
        stickers.push(newSticker);
        setSelectedStickerId(newSticker.id);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <button
            onClick={() => setStep('review')}
            className="inline-flex items-center gap-1 text-xs text-black dark:text-stone-300 hover:text-theme-primary mb-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Review</span>
          </button>
          <h2 className="text-2xl font-fredoka font-semibold text-theme-primary">
            Studio Editor
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Photostrip Canvas Preview */}
        <div
          ref={containerRef}
          className="md:col-span-7 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center relative"
        >
          {/* Responsive Frame Navigation Bar - NEVER clips off */}
          <div className="w-full flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm max-w-sm">
            <button
              onClick={handleSelectPrevFrame}
              title="Previous Frame"
              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {layout.slots.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSlotIndex(s.id)}
                    className={`w-7 h-7 rounded-lg text-xs font-fredoka font-semibold transition-all cursor-pointer ${
                      selectedSlotIndex === s.id
                        ? 'soft-btn-coral !p-0 !text-white font-bold'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    #{s.id + 1}
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 hidden sm:inline">
                (Frame {selectedSlotIndex + 1}/{layout.slots.length})
              </span>
            </div>

            <button
              onClick={handleSelectNextFrame}
              title="Next Frame"
              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-3 text-center">
            Click frame to select • Drag photo to pan • Drag/rotate stickers with handles
          </div>

          {/* Konva Stage Container — touch-action:none prevents scroll conflict on mobile */}
          <div className="relative flex items-center justify-center" style={{ touchAction: 'none' }}>
            <div
              className="rounded-xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-md"
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
                  onMouseDown={(e) => {
                    // Clicking stage background deselects sticker
                    if (e.target === e.target.getStage()) {
                      setSelectedStickerId(null);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (e.target === e.target.getStage()) {
                      setSelectedStickerId(null);
                    }
                  }}
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
                          isExporting={isExporting}
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

                  {/* LAYER 3: Prominent Date/Memory Stamp & Draggable Rotatable Stickers */}
                  <Layer>
                    {dateStamp.enabled && (
                      <KonvaText
                        x={16}
                        y={layout.height - 36 - (dateStamp.fontSize || 20)}
                        width={layout.width - 32}
                        text={dateStamp.customText}
                        fontFamily={dateStamp.font}
                        fontSize={dateStamp.fontSize || 20}
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
                        isExporting={isExporting}
                        onSelect={() => setSelectedStickerId(sticker.id)}
                        onUpdate={(updates) => updateSticker(sticker.id, updates)}
                      />
                    ))}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Studio Controls */}
        <div className="md:col-span-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-5">
          {/* Tab Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
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
                      ? 'bg-theme-soft/50 dark:bg-stone-800 text-theme-primary border border-theme-primary shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
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
                <span className="font-fredoka font-semibold text-theme-primary">Color Grading</span>
                <label className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 cursor-pointer">
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
                          ? 'border-kiwali-coral bg-kiwali-soft-pink/40 text-stone-900 dark:text-white dark:bg-stone-800 font-semibold'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-stone-200 dark:border-stone-700"
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
                <span className="font-fredoka font-semibold text-theme-primary">Zoom Frame #{selectedSlotIndex + 1}</span>
                <button
                  onClick={() => updatePhoto(selectedSlotIndex, { x: 0, y: 0, scale: 1 })}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline flex items-center gap-1 cursor-pointer"
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
                <div className="text-right text-[11px] text-stone-400 font-sans font-medium">
                  {Math.round((selectedPhoto?.scale || 1) * 100)}%
                </div>
              </div>

              <p className="text-[11px] text-black dark:text-stone-300 font-sans bg-stone-50 dark:bg-stone-800 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                Auto-snap active: Photo edges automatically lock to frame boundaries so no gaps appear.
              </p>
            </div>
          )}

          {/* TAB 3: DATE STAMP & CUSTOM MEMORY TEXT */}
          {activeTab === 'date' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-fredoka font-semibold text-theme-primary">Date Stamp &amp; Memory Text</span>
                <label className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dateStamp.enabled}
                    onChange={(e) => setDateStamp(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-stone-300 text-kiwali-coral focus:ring-kiwali-coral"
                  />
                  <span>Show</span>
                </label>
              </div>

              {dateStamp.enabled && (
                <>
                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                      Custom Memory Text / Date
                    </label>
                    <input
                      type="text"
                      value={dateStamp.customText}
                      onChange={(e) => setDateStamp(prev => ({ ...prev, customText: e.target.value }))}
                      placeholder="e.g. summer with besties • 2026.09.24"
                      className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-kiwali-coral"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Displays prominently on the bottom of your photostrip.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                      Typography
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'Fredoka', name: 'Fredoka' },
                        { id: 'Open Sans', name: 'Open Sans' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setDateStamp(prev => ({ ...prev, font: f.id as StampFont }))}
                          className={`p-2 rounded-xl border text-xs text-center cursor-pointer transition-colors ${
                            dateStamp.font === f.id
                              ? 'border-kiwali-coral bg-kiwali-soft-pink/30 font-semibold text-stone-900 dark:text-white dark:bg-stone-800'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Size / Resize Controls */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Type className="w-3.5 h-3.5" />
                        <span>Text Size</span>
                      </div>
                      <span className="font-sans font-medium text-[10px] text-stone-400">
                        {dateStamp.fontSize || 20}px
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setDateStamp(prev => ({
                            ...prev,
                            fontSize: Math.max(12, (prev.fontSize || 20) - 2),
                          }))
                        }
                        className="w-8 h-8 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center justify-center cursor-pointer text-stone-600 dark:text-stone-300"
                        title="Decrease text size"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="range"
                        min="12"
                        max="36"
                        step="1"
                        value={dateStamp.fontSize || 20}
                        onChange={(e) =>
                          setDateStamp(prev => ({
                            ...prev,
                            fontSize: parseInt(e.target.value, 10),
                          }))
                        }
                        className="flex-1 accent-kiwali-coral cursor-pointer"
                      />

                      <button
                        onClick={() =>
                          setDateStamp(prev => ({
                            ...prev,
                            fontSize: Math.min(36, (prev.fontSize || 20) + 2),
                          }))
                        }
                        className="w-8 h-8 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center justify-center cursor-pointer text-stone-600 dark:text-stone-300"
                        title="Increase text size"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Size Presets */}
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {[
                        { label: 'Small', size: 14 },
                        { label: 'Medium', size: 20 },
                        { label: 'Large', size: 26 },
                        { label: 'XL', size: 32 },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          onClick={() =>
                            setDateStamp(prev => ({ ...prev, fontSize: preset.size }))
                          }
                          className={`py-1 text-[11px] rounded-lg border text-center transition-all cursor-pointer ${
                            (dateStamp.fontSize || 20) === preset.size
                              ? 'border-kiwali-coral bg-kiwali-soft-pink/30 font-semibold text-stone-900 dark:text-white dark:bg-stone-800'
                              : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      {['#1C1917', '#F8FAFC', '#FF6B81', '#3B82F6', '#10B981', '#A855F7'].map(c => (
                        <button
                          key={c}
                          onClick={() => setDateStamp(prev => ({ ...prev, color: c }))}
                          className={`w-6 h-6 rounded-full border border-stone-300 dark:border-stone-600 transition-transform ${
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

          {/* TAB 4: STICKERS (ROTATABLE & SCALABLE CANVA-STYLE) */}
          {activeTab === 'stickers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-fredoka font-semibold text-theme-primary">Stickers &amp; Decor</span>
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
                  Upload any transparent PNG image file
                </p>
              </div>

              {/* Preset sticker icons */}
              <div>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1.5">Preset Stickers</span>
                <div className="grid grid-cols-6 gap-2 p-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                  {STICKER_PRESETS.slice(0, 12).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addSticker(emoji)}
                      className="w-9 h-9 rounded-lg bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-lg active:scale-95 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Sticker Controls: Rotate, Scale & Remove */}
              {selectedSticker && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-700 dark:text-stone-200">
                      Selected Sticker {selectedSticker.emoji}
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

                  {/* Size slider */}
                  <div>
                    <span className="block text-[10px] text-stone-400 mb-1">Scale / Size</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateSticker(selectedSticker.id, {
                            scale: Math.max(0.3, selectedSticker.scale - 0.2),
                          })
                        }
                        className="p-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="range"
                        min="0.3"
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
                        className="p-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Rotation control */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                      <span>Rotation: {selectedSticker.rotation || 0}°</span>
                      <button
                        onClick={() => updateSticker(selectedSticker.id, { rotation: 0 })}
                        className="text-stone-400 hover:text-stone-600 underline cursor-pointer"
                      >
                        Reset 0°
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="5"
                        value={selectedSticker.rotation || 0}
                        onChange={(e) =>
                          updateSticker(selectedSticker.id, {
                            rotation: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-kiwali-coral cursor-pointer"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-400 text-center">
                    Tip: You can also drag the rotation handle or corner anchors directly on the canvas!
                  </p>
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
                          ? 'border-kiwali-coral bg-kiwali-soft-pink/50 text-stone-900 dark:text-white dark:bg-stone-800 font-semibold'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span>{s.emoji || 'PNG'}</span>
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

      {/* Prominent Bottom CTA Bar */}
      <div className="mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={() => setStep('review')}
          className="w-full sm:w-auto soft-btn-secondary text-sm px-5 py-3 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-stone-500" />
          <span>Back to Review</span>
        </button>

        <button
          onClick={handleProceedToSave}
          className="w-full sm:w-auto soft-btn-coral text-sm px-8 py-3.5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Save Photostrip</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
