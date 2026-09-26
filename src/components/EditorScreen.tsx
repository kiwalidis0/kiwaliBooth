import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Type,
  Sun,
  Undo2,
  Redo2,
  Contrast,
  Droplets,
  Flame,
  Copy,
  GripHorizontal,
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { STICKER_PRESETS } from '../data/templates';
import { FILTER_LIST, applyFilterToCanvas } from '../utils/filters';
import { generateTemplateOverlaySvg } from '../utils/templateGenerator';
import { VECTOR_STICKERS, STICKER_CATEGORIES, type StickerCategory } from '../data/stickers';
import { getFormattedDate } from '../utils/date';
import type {
  FilterType,
  StampFont,
  StickerItem,
  LayoutConfig,
  TemplateConfig,
  CapturedPhoto,
  LayoutPhotoAssignments,
  DateStampConfig,
  FinalImagesMap,
  PhotoAdjustments,
} from '../types/photobooth';

function useFilteredImage(url: string | undefined, filter: FilterType, adjustments?: PhotoAdjustments) {
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
      const hasAdj = adjustments && (adjustments.brightness !== 0 || adjustments.contrast !== 0 || adjustments.saturation !== 0 || adjustments.warmth !== 0);
      if (filter === 'normal' && !hasAdj) {
        setElement(img);
      } else {
        const filtered = applyFilterToCanvas(img, filter, adjustments);
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
  }, [url, filter, adjustments]);

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
  photo: { dataUrl: string; filter: FilterType; adjustments?: PhotoAdjustments; x: number; y: number; scale: number };
  isSelected: boolean;
  isExporting: boolean;
  isLocked?: boolean;
  isDragOver?: boolean;
  onSelect: () => void;
  onUpdatePosition: (x: number, y: number) => void;
}

const SlotPhotoItem: React.FC<SlotPhotoProps> = ({
  slot,
  photo,
  isSelected,
  isExporting,
  isLocked = false,
  isDragOver = false,
  onSelect,
  onUpdatePosition,
}) => {
  const filteredImg = useFilteredImage(photo?.dataUrl, photo?.filter || 'normal', photo?.adjustments);

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
          draggable={!isLocked}
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
      {!isExporting && isSelected && !isDragOver && (
        <Rect
          width={slot.width}
          height={slot.height}
          stroke="#FF6B81"
          strokeWidth={3}
          cornerRadius={slot.borderRadius}
          listening={false}
        />
      )}

      {/* Drop Target Highlight Ring when dragging a photo over this slot */}
      {!isExporting && isDragOver && (
        <Rect
          width={slot.width}
          height={slot.height}
          stroke="#FF6B81"
          strokeWidth={4}
          dash={[10, 6]}
          fill="rgba(255, 107, 129, 0.25)"
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

  // Attach touch-friendly Canva-style Transformer when selected
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
            width={90 * sticker.scale}
            height={90 * sticker.scale}
            offsetX={(90 * sticker.scale) / 2}
            offsetY={(90 * sticker.scale) / 2}
          />
        ) : (
          <KonvaText
            text={sticker.emoji || '★'}
            fontSize={38 * sticker.scale}
            offsetX={(38 * sticker.scale) / 2}
            offsetY={(38 * sticker.scale) / 2}
            align="center"
            verticalAlign="middle"
          />
        )}
      </Group>

      {/* Enhanced touch-friendly Transformer: large 24px handles + thicker bounding guide */}
      {!isExporting && isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
              return oldBox;
            }
            return newBox;
          }}
          borderStroke="#FF6B81"
          borderStrokeWidth={2.5}
          borderDash={[4, 4]}
          anchorStroke="#FF6B81"
          anchorStrokeWidth={2.5}
          anchorFill="#FFFFFF"
          anchorSize={24}
          hitStrokeWidth={16}
          anchorCornerRadius={6}
          rotateAnchorOffset={32}
        />
      )}
    </>
  );
};

interface PhotostripStageProps {
  layout: LayoutConfig;
  template: TemplateConfig;
  customOverlayUrl: string | null;
  photos: CapturedPhoto[];
  layoutPhotoAssignments: LayoutPhotoAssignments;
  dateStamp: DateStampConfig;
  stickers: StickerItem[];
  isExporting: boolean;
  selectedSlotIndex?: number;
  selectedStickerId?: string | null;
  hoveredSlotId?: number | null;
  onSelectSlot?: (slotId: number) => void;
  onUpdatePhotoPosition?: (photoIndex: number, x: number, y: number) => void;
  onSelectSticker?: (id: string) => void;
  onUpdateSticker?: (id: string, updates: Partial<StickerItem>) => void;
  onDeselectAll?: () => void;
}

const PhotostripStage = React.forwardRef<Konva.Stage, PhotostripStageProps>(
  (
    {
      layout,
      template,
      customOverlayUrl,
      photos,
      layoutPhotoAssignments,
      dateStamp,
      stickers,
      isExporting,
      selectedSlotIndex,
      selectedStickerId,
      hoveredSlotId,
      onSelectSlot,
      onUpdatePhotoPosition,
      onSelectSticker,
      onUpdateSticker,
      onDeselectAll,
    },
    ref
  ) => {
    const overlaySvgUrl = useMemo(
      () => generateTemplateOverlaySvg(layout, template),
      [layout, template]
    );
    const overlaySvgImage = useSimpleImage(overlaySvgUrl);
    const customOverlayImage = useSimpleImage(customOverlayUrl);

    // Safety lock: lock slot photos while any sticker is active/transforming
    const isPhotoLocked = Boolean(selectedStickerId);

    return (
      <Stage
        ref={ref}
        width={layout.width}
        height={layout.height}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage() && onDeselectAll) {
            onDeselectAll();
          }
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage() && onDeselectAll) {
            onDeselectAll();
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
            const assignedPhotoIndex = layoutPhotoAssignments[layout.id]?.[slot.id] ?? slot.id;
            const photo = photos.find(p => p.slotIndex === assignedPhotoIndex) || photos[slot.id % (photos.length || 1)] || {
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
                key={`${layout.id}-slot-${slot.id}`}
                slot={slot}
                photo={photo}
                isSelected={!isExporting && selectedSlotIndex === slot.id}
                isExporting={isExporting}
                isLocked={isPhotoLocked}
                isDragOver={!isExporting && hoveredSlotId === slot.id}
                onSelect={() => onSelectSlot?.(slot.id)}
                onUpdatePosition={(x, y) => onUpdatePhotoPosition?.(assignedPhotoIndex, x, y)}
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

        {/* LAYER 3: Elevated Date & Memory Stamp (Stacked) & Draggable Rotatable Stickers */}
        <Layer>
          {dateStamp.enabled && (() => {
            const hasStamp = (dateStamp.stampEnabled ?? false) && Boolean(dateStamp.stampText || dateStamp.customText);
            const hasDate = (dateStamp.dateEnabled ?? true) && Boolean(dateStamp.dateText);
            const stampFontSize = dateStamp.stampFontSize || dateStamp.fontSize || 22;
            const dateFontSize = dateStamp.dateFontSize || 13;
            const stampTextVal = (dateStamp.stampText || dateStamp.customText || '').trim();
            const dateTextVal = (dateStamp.dateText || getFormattedDate(dateStamp.format)).trim();

            if (!hasStamp && !hasDate) return null;

            const lastSlot = layout.slots[layout.slots.length - 1];
            const slotBottom = lastSlot ? lastSlot.y + lastSlot.height : layout.height - 180;
            const chinHeight = layout.height - slotBottom;

            // Stacked layout: Memory text pushed towards top of chin, Date below, app watermark at very bottom
            if (hasStamp && hasDate) {
              const dateY = layout.height - 68;
              const stampY = slotBottom + Math.max(14, (chinHeight - 95 - stampFontSize) * 0.40);
              return (
                <Group>
                  <KonvaText
                    x={16}
                    y={stampY}
                    width={layout.width - 32}
                    text={stampTextVal}
                    fontFamily={dateStamp.font}
                    fontSize={stampFontSize}
                    fontStyle="bold"
                    fill={dateStamp.color}
                    align="center"
                    letterSpacing={1.5}
                  />
                  <KonvaText
                    x={16}
                    y={dateY}
                    width={layout.width - 32}
                    text={dateTextVal}
                    fontFamily="monospace"
                    fontSize={dateFontSize}
                    fontStyle="normal"
                    fill={dateStamp.color}
                    opacity={0.82}
                    align="center"
                    letterSpacing={2}
                  />
                </Group>
              );
            }

            // Only Stamp active: pushed towards top of chin
            if (hasStamp) {
              const stampY = slotBottom + Math.max(16, (chinHeight - 45 - stampFontSize) * 0.45);
              return (
                <KonvaText
                  x={16}
                  y={stampY}
                  width={layout.width - 32}
                  text={stampTextVal}
                  fontFamily={dateStamp.font}
                  fontSize={stampFontSize}
                  fontStyle="bold"
                  fill={dateStamp.color}
                  align="center"
                  letterSpacing={1.5}
                />
              );
            }

            // Only Date active
            return (
              <KonvaText
                x={16}
                y={layout.height - 65}
                width={layout.width - 32}
                text={dateTextVal}
                fontFamily="monospace"
                fontSize={dateFontSize}
                fontStyle="normal"
                fill={dateStamp.color}
                align="center"
                letterSpacing={2}
              />
            );
          })()}

          {stickers.map((sticker) => (
            <KonvaStickerItem
              key={sticker.id}
              sticker={sticker}
              isSelected={!isExporting && selectedStickerId === sticker.id}
              isExporting={isExporting}
              onSelect={() => onSelectSticker?.(sticker.id)}
              onUpdate={(updates) => onUpdateSticker?.(sticker.id, updates)}
            />
          ))}
        </Layer>
      </Stage>
    );
  }
);
PhotostripStage.displayName = 'PhotostripStage';

export const EditorScreen: React.FC = () => {
  const {
    selectedLayoutId,
    selectedLayoutIds,
    activeStudioLayoutId,
    setActiveStudioLayoutId,
    layoutPhotoAssignments,
    assignPhotoToSlot,
    customOverlayUrl,
    photos,
    setPhotos,
    updatePhoto,
    updatePhotoAdjustment,
    setGlobalFilter,
    dateStamp,
    setDateStamp,
    stickers,
    setStickers,
    addSticker,
    updateSticker,
    removeSticker,
    setFinalImage,
    setFinalImages,
    setFinalImageForLayout,
    setStep,
    activeTemplate,
    registerSaveHandler,
  } = useBooth();

  const currentLayoutId = activeStudioLayoutId || selectedLayoutId;
  const layout = LAYOUTS[currentLayoutId] || LAYOUTS.classic4;
  const template = activeTemplate;

  const stageRef = useRef<Konva.Stage>(null);
  const offscreenStageRefs = useRef<Record<string, Konva.Stage>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'filter' | 'adjust' | 'zoom' | 'date' | 'stickers'>('filter');
  const [applyAllFilters, setApplyAllFilters] = useState<boolean>(true);
  const [applyAllAdjustments, setApplyAllAdjustments] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Photo drag-and-drop reorder & swap state
  const [dragState, setDragState] = useState<{
    photoIndex: number;
    sourceSlotIndex: number;
    clientX: number;
    clientY: number;
    thumbnailUrl: string;
  } | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  const [stickerCategory, setStickerCategory] = useState<StickerCategory | 'All'>('All');
  const pointerStartRef = useRef<{ x: number; y: number; photoIndex: number; sourceSlotIndex: number; thumbnailUrl: string } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Undo / Redo history state
  interface HistorySnapshot {
    photos: CapturedPhoto[];
    stickers: StickerItem[];
    dateStamp: DateStampConfig;
  }
  // Undo / Redo history state initialized with current photo session
  const [history] = useState<HistorySnapshot[]>(() => {
    return photos.length > 0 ? [{ photos, stickers, dateStamp }] : [];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    return photos.length > 0 ? 0 : -1;
  });
  const isHistoryNavigating = useRef(false);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryNavigating.current = true;
      const target = history[historyIndex - 1];
      setPhotos(target.photos);
      setStickers(target.stickers);
      setDateStamp(target.dateStamp);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex, setPhotos, setStickers, setDateStamp]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryNavigating.current = true;
      const target = history[historyIndex + 1];
      setPhotos(target.photos);
      setStickers(target.stickers);
      setDateStamp(target.dateStamp);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex, setPhotos, setStickers, setDateStamp]);

  // Global keyboard shortcuts: Ctrl/Cmd+Z (Undo) and Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z (Redo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as Element)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.code === 'KeyZ') || e.code === 'KeyY')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  const [previewScale, setPreviewScale] = useState<number>(0.35);

  useEffect(() => {
    const el = previewViewportRef.current;
    if (!el) return;

    const updateScaleFromRect = (width: number, height: number) => {
      if (width > 20 && height > 20) {
        const availH = height - 12;
        const availW = width - 12;
        const scaleH = availH / layout.height;
        const scaleW = availW / layout.width;
        setPreviewScale(Math.min(scaleH, scaleW, 0.44));
      }
    };

    updateScaleFromRect(el.clientWidth, el.clientHeight);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        updateScaleFromRect(width, height);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.width, layout.height]);

  const selectedSticker = stickers.find(s => s.id === selectedStickerId) || null;

  // Save Photostrip with 100% outline clearance guarantee across ALL selected layouts
  const handleProceedToSave = useCallback(async () => {
    // 1. Clear sticker selection & slot highlight
    setSelectedStickerId(null);
    setIsExporting(true);

    // 2. Wait for React state to flush and Konva layers to redraw cleanly
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 3. Export all selected layouts cleanly without any transformer or red bounding boxes
    const newFinalImages: FinalImagesMap = {};

    for (const lId of selectedLayoutIds) {
      const stage = lId === currentLayoutId ? stageRef.current : offscreenStageRefs.current[lId];
      if (stage) {
        try {
          const dataUrl = stage.toDataURL({ pixelRatio: 2 });
          newFinalImages[lId] = dataUrl;
        } catch (err) {
          console.warn(`High-res export failed for ${lId}, falling back to pixelRatio 1:`, err);
          try {
            const dataUrl = stage.toDataURL({ pixelRatio: 1 });
            newFinalImages[lId] = dataUrl;
          } catch (e) {
            console.error(`Canvas export error for ${lId}:`, e);
          }
        }
      }
    }

    // Ensure active layout is preserved in newFinalImages
    if (stageRef.current && !newFinalImages[currentLayoutId]) {
      try {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        newFinalImages[currentLayoutId] = dataUrl;
      } catch (e) {
        console.error('Error exporting current layout:', e);
      }
    }

    setFinalImages(newFinalImages);
    const activeUrl = newFinalImages[currentLayoutId] || Object.values(newFinalImages)[0] || null;
    setFinalImage(activeUrl);
    setFinalImageForLayout(currentLayoutId, activeUrl || '');
    setIsExporting(false);
    setStep('download');
  }, [currentLayoutId, selectedLayoutIds, setFinalImage, setFinalImageForLayout, setFinalImages, setStep]);

  useEffect(() => {
    registerSaveHandler(handleProceedToSave);
    return () => {
      registerSaveHandler(null);
    };
  }, [handleProceedToSave, registerSaveHandler]);

  const handleFilterSelect = (filterId: FilterType) => {
    if (applyAllFilters) {
      setGlobalFilter(filterId);
    } else {
      updatePhoto(selectedSlotIndex, { filter: filterId });
    }
  };

  const assignedPhotoIndex = layoutPhotoAssignments[currentLayoutId]?.[selectedSlotIndex] ?? selectedSlotIndex;
  const selectedPhoto = photos.find(p => p.slotIndex === assignedPhotoIndex) || photos[selectedSlotIndex % (photos.length || 1)];

  const currentAdjustments: PhotoAdjustments = selectedPhoto?.adjustments || {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
  };

  const handleAdjustmentChange = (key: keyof PhotoAdjustments, value: number) => {
    if (applyAllAdjustments) {
      photos.forEach(p => {
        updatePhotoAdjustment(p.slotIndex, { [key]: value });
      });
    } else {
      updatePhotoAdjustment(assignedPhotoIndex, { [key]: value });
    }
  };

  const handleResetAdjustments = () => {
    const reset = { brightness: 0, contrast: 0, saturation: 0, warmth: 0 };
    if (applyAllAdjustments) {
      photos.forEach(p => {
        updatePhotoAdjustment(p.slotIndex, reset);
      });
    } else {
      updatePhotoAdjustment(assignedPhotoIndex, reset);
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

  // Sticker Contextual Actions: Rotate 90° & Duplicate
  const handleRotateSticker90 = useCallback(() => {
    if (!selectedStickerId) return;
    const stk = stickers.find(s => s.id === selectedStickerId);
    if (!stk) return;
    const newRotation = ((stk.rotation || 0) + 90) % 360;
    updateSticker(stk.id, { rotation: newRotation });
  }, [selectedStickerId, stickers, updateSticker]);

  const handleDuplicateSticker = useCallback(() => {
    if (!selectedStickerId) return;
    const stk = stickers.find(s => s.id === selectedStickerId);
    if (!stk) return;
    const newId = `stk-dup-${Date.now()}`;
    const duplicated: StickerItem = {
      ...stk,
      id: newId,
      x: stk.x + 24,
      y: stk.y + 24,
    };
    setStickers(prev => [...prev, duplicated]);
    setSelectedStickerId(newId);
  }, [selectedStickerId, stickers, setStickers]);

  // Photo Drag-and-Drop Slot Swapping
  const handleSwapPhotoIntoSlot = useCallback(
    (draggedPhotoIdx: number, sourceSlotIdx: number, targetSlotIdx: number) => {
      const currentAssignments = layoutPhotoAssignments[currentLayoutId]
        ? [...layoutPhotoAssignments[currentLayoutId]]
        : layout.slots.map(s => s.id);

      let fromSlot = sourceSlotIdx;
      if (fromSlot === -1) {
        fromSlot = currentAssignments.findIndex(pIdx => pIdx === draggedPhotoIdx);
      }

      if (fromSlot !== -1 && fromSlot !== targetSlotIdx) {
        const targetPhotoIdx = currentAssignments[targetSlotIdx] ?? targetSlotIdx;
        assignPhotoToSlot(currentLayoutId, targetSlotIdx, draggedPhotoIdx);
        assignPhotoToSlot(currentLayoutId, fromSlot, targetPhotoIdx);
      } else {
        assignPhotoToSlot(currentLayoutId, targetSlotIdx, draggedPhotoIdx);
      }
      setSelectedSlotIndex(targetSlotIdx);
    },
    [currentLayoutId, layout.slots, layoutPhotoAssignments, assignPhotoToSlot]
  );

  const handlePhotoPointerDown = useCallback(
    (photoIndex: number, sourceSlotIndex: number, thumbnailUrl: string, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      pointerStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        photoIndex,
        sourceSlotIndex,
        thumbnailUrl,
      };
      isDraggingRef.current = false;

      const handlePointerMove = (moveEv: PointerEvent) => {
        if (!pointerStartRef.current) return;
        const dx = moveEv.clientX - pointerStartRef.current.x;
        const dy = moveEv.clientY - pointerStartRef.current.y;
        if (!isDraggingRef.current) {
          if (Math.hypot(dx, dy) > 6) {
            isDraggingRef.current = true;
          } else {
            return;
          }
        }

        setDragState({
          photoIndex: pointerStartRef.current.photoIndex,
          sourceSlotIndex: pointerStartRef.current.sourceSlotIndex,
          clientX: moveEv.clientX,
          clientY: moveEv.clientY,
          thumbnailUrl: pointerStartRef.current.thumbnailUrl,
        });

        // Detect hover over stage slots
        if (stageRef.current) {
          const container = stageRef.current.container();
          if (container) {
            const rect = container.getBoundingClientRect();
            if (
              moveEv.clientX >= rect.left &&
              moveEv.clientX <= rect.right &&
              moveEv.clientY >= rect.top &&
              moveEv.clientY <= rect.bottom
            ) {
              const stageX = (moveEv.clientX - rect.left) / previewScale;
              const stageY = (moveEv.clientY - rect.top) / previewScale;
              const hit = layout.slots.find(
                (s) =>
                  stageX >= s.x &&
                  stageX <= s.x + s.width &&
                  stageY >= s.y &&
                  stageY <= s.y + s.height
              );
              setHoveredSlotId(hit !== undefined ? hit.id : null);
            } else {
              setHoveredSlotId(null);
            }
          }
        }
      };

      const handlePointerUp = (upEv: PointerEvent) => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        if (isDraggingRef.current && pointerStartRef.current) {
          if (stageRef.current) {
            const container = stageRef.current.container();
            if (container) {
              const rect = container.getBoundingClientRect();
              if (
                upEv.clientX >= rect.left &&
                upEv.clientX <= rect.right &&
                upEv.clientY >= rect.top &&
                upEv.clientY <= rect.bottom
              ) {
                const stageX = (upEv.clientX - rect.left) / previewScale;
                const stageY = (upEv.clientY - rect.top) / previewScale;
                const hit = layout.slots.find(
                  (s) =>
                    stageX >= s.x &&
                    stageX <= s.x + s.width &&
                    stageY >= s.y &&
                    stageY <= s.y + s.height
                );
                if (hit !== undefined) {
                  handleSwapPhotoIntoSlot(
                    pointerStartRef.current.photoIndex,
                    pointerStartRef.current.sourceSlotIndex,
                    hit.id
                  );
                }
              }
            }
          }
        }

        setDragState(null);
        setHoveredSlotId(null);
        pointerStartRef.current = null;
        isDraggingRef.current = false;
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [previewScale, layout.slots, handleSwapPhotoIntoSlot]
  );

  const filteredVectorStickers = useMemo(() => {
    if (stickerCategory === 'All') return VECTOR_STICKERS;
    return VECTOR_STICKERS.filter(s => s.category === stickerCategory);
  }, [stickerCategory]);


  return (
    <div className="py-6 px-4 max-w-5xl mx-auto pb-28 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <button
            onClick={() => setStep('review')}
            className="hidden sm:inline-flex items-center gap-1 text-xs text-black dark:text-stone-300 hover:text-theme-primary mb-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Review</span>
          </button>
          <h2 className="text-2xl font-fredoka font-semibold text-theme-primary">
            Studio Editor
          </h2>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Photostrip Canvas Preview - Fixed stable height on desktop */}
        <div
          ref={containerRef}
          className="w-full min-w-0 md:col-span-7 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between min-h-[660px] md:h-[780px] overflow-hidden relative"
        >
          {/* Top Controls Wrapper */}
          <div className="w-full flex flex-col items-center">
            {/* Multi-Layout Switcher Bar (when multiple layouts chosen) */}
            {selectedLayoutIds.length > 1 && (
              <div className="w-full flex items-center justify-between mb-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm max-w-sm">
                <span className="text-[11px] font-fredoka font-semibold text-theme-primary">
                  Layout:
                </span>
                <div className="flex gap-1">
                  {selectedLayoutIds.map(lId => {
                    const isCurrentLayout = lId === currentLayoutId;
                    const lCfg = LAYOUTS[lId];
                    return (
                      <button
                        key={lId}
                        onClick={() => {
                          setActiveStudioLayoutId(lId);
                          setSelectedSlotIndex(0);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-fredoka transition-all cursor-pointer ${
                          isCurrentLayout
                            ? 'soft-btn-coral !p-1 !px-2.5 !text-white font-bold shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {lCfg.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Responsive Frame Navigation Bar */}
            <div className="w-full flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm max-w-sm">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo (Ctrl+Z)"
                  aria-label="Undo"
                  className={`p-1 rounded-lg text-stone-600 dark:text-stone-300 transition-colors ${
                    historyIndex <= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer'
                  }`}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo (Ctrl+Y)"
                  aria-label="Redo"
                  className={`p-1 rounded-lg text-stone-600 dark:text-stone-300 transition-colors ${
                    historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer'
                  }`}
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSelectPrevFrame}
                  title="Previous Frame"
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

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

                <button
                  onClick={handleSelectNextFrame}
                  title="Next Frame"
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Always-Visible Photo Tray with Draggable & Click-to-Assign Thumbnails */}
            <div className="w-full max-w-sm bg-white dark:bg-stone-800 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <GripHorizontal className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-fredoka text-xs font-semibold text-stone-700 dark:text-stone-200">
                    Photo Tray
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans">
                    ({photos.length} shots • Drag to swap or tap)
                  </span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                {photos.map((p, idx) => {
                  const currentAssignments = layoutPhotoAssignments[currentLayoutId] || [];
                  const assignedSlotId = layout.slots.findIndex(
                    (s) => (currentAssignments[s.id] ?? s.id) === p.slotIndex
                  );
                  const isCurrentlyInSelectedSlot = assignedPhotoIndex === p.slotIndex;

                  return (
                    <div
                      key={p.id}
                      onPointerDown={(e) =>
                        handlePhotoPointerDown(
                          p.slotIndex,
                          assignedSlotId,
                          p.dataUrl,
                          e
                        )
                      }
                      onClick={() => {
                        handleSwapPhotoIntoSlot(p.slotIndex, assignedSlotId, selectedSlotIndex);
                      }}
                      className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing flex-shrink-0 select-none touch-none ${
                        isCurrentlyInSelectedSlot
                          ? 'border-theme-primary ring-2 ring-theme-primary/30 shadow-sm scale-105'
                          : 'border-stone-200 dark:border-stone-700 opacity-80 hover:opacity-100'
                      }`}
                      title={`Shot #${idx + 1} - Drag onto a frame or click to assign`}
                    >
                      <img
                        src={p.dataUrl}
                        alt={`Shot #${idx + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      <div className="absolute top-0 left-0 bg-black/60 text-white font-fredoka text-[8px] px-1 rounded-br">
                        #{idx + 1}
                      </div>
                      {assignedSlotId !== -1 && (
                        <div className="absolute bottom-0 right-0 bg-theme-primary text-white font-fredoka text-[8px] px-1 rounded-tl font-bold">
                          #{assignedSlotId + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Konva Stage Container — flex-1 min-h-0 guarantees strip stays fully contained within wrapper */}
          <div
            ref={previewViewportRef}
            className="flex-1 min-h-0 w-full flex items-center justify-center my-1 relative overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            {/* Floating Contextual Sticker Toolbar (Rotate 90°, Copy, Delete) */}
            {selectedSticker && !isExporting && (
              <div
                className="absolute z-30 flex items-center gap-1 bg-stone-900/95 text-white backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-xl border border-stone-700/80 -translate-x-1/2 -translate-y-full pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150"
                style={{
                  top: Math.max(16, selectedSticker.y * previewScale - 12),
                  left: Math.min(
                    Math.max(90, selectedSticker.x * previewScale),
                    layout.width * previewScale - 90
                  ),
                }}
              >
                <button
                  type="button"
                  onClick={handleRotateSticker90}
                  title="Rotate 90 degrees"
                  className="p-1 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="font-medium text-[10px]">90°</span>
                </button>
                <div className="w-[1px] h-3.5 bg-stone-700" />
                <button
                  type="button"
                  onClick={handleDuplicateSticker}
                  title="Duplicate sticker"
                  className="p-1 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="font-medium text-[10px]">Copy</span>
                </button>
                <div className="w-[1px] h-3.5 bg-stone-700" />
                <button
                  type="button"
                  onClick={() => {
                    removeSticker(selectedSticker.id);
                    setSelectedStickerId(null);
                  }}
                  title="Delete sticker"
                  className="p-1 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-full transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-medium text-[10px]">Delete</span>
                </button>
              </div>
            )}

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
                <PhotostripStage
                  ref={stageRef}
                  layout={layout}
                  template={template}
                  customOverlayUrl={customOverlayUrl}
                  photos={photos}
                  layoutPhotoAssignments={layoutPhotoAssignments}
                  dateStamp={dateStamp}
                  stickers={stickers}
                  isExporting={isExporting}
                  selectedSlotIndex={selectedSlotIndex}
                  selectedStickerId={selectedStickerId}
                  hoveredSlotId={hoveredSlotId}
                  onSelectSlot={(id) => {
                    setSelectedSlotIndex(id);
                    setSelectedStickerId(null);
                  }}
                  onUpdatePhotoPosition={(photoIdx, x, y) => updatePhoto(photoIdx, { x, y })}
                  onSelectSticker={(id) => setSelectedStickerId(id)}
                  onUpdateSticker={(id, updates) => updateSticker(id, updates)}
                  onDeselectAll={() => setSelectedStickerId(null)}
                />
              </div>
            </div>
          </div>

          {/* Offscreen rendering stages for all other selected layouts to ensure multi-cutout export */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: -99999,
              top: -99999,
              width: 1,
              height: 1,
              overflow: 'hidden',
              opacity: 0,
              pointerEvents: 'none',
            }}
          >
            {selectedLayoutIds.map((lId) => {
              if (lId === currentLayoutId) return null;
              const lCfg = LAYOUTS[lId];
              if (!lCfg) return null;
              return (
                <PhotostripStage
                  key={`offscreen-${lId}`}
                  ref={(node) => {
                    if (node) {
                      offscreenStageRefs.current[lId] = node;
                    } else {
                      delete offscreenStageRefs.current[lId];
                    }
                  }}
                  layout={lCfg}
                  template={template}
                  customOverlayUrl={customOverlayUrl}
                  photos={photos}
                  layoutPhotoAssignments={layoutPhotoAssignments}
                  dateStamp={dateStamp}
                  stickers={stickers}
                  isExporting={isExporting}
                />
              );
            })}
          </div>

          <div className="text-[11px] text-stone-400 dark:text-stone-500 pt-1 text-center">
            Click frame to select • Drag photo to pan • Drag/rotate stickers with handles
          </div>
        </div>

        {/* Right Column: Clean Studio Controls - Stable height on desktop */}
        <div className="w-full min-w-0 md:col-span-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 flex flex-col min-h-[660px] md:h-[780px] overflow-hidden">
          {/* Tab Selector - Fixed at top of right panel */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl flex-shrink-0 mb-4">
            {[
              { id: 'filter', label: 'Filters', icon: Sliders },
              { id: 'adjust', label: 'Adjust', icon: Sun },
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

          {/* Scrollable Tool Drawer - Generous padding to prevent cutting off controls */}
          <div className="flex-1 overflow-y-auto pr-1 pb-10 min-w-0">
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

          {/* TAB 2: ADJUSTMENTS */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-fredoka font-semibold text-theme-primary">Fine Adjustments</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyAllAdjustments}
                      onChange={(e) => setApplyAllAdjustments(e.target.checked)}
                      className="rounded border-stone-300 text-theme-primary focus:ring-theme-primary"
                    />
                    <span>All frames</span>
                  </label>
                  <button
                    onClick={handleResetAdjustments}
                    title="Reset Adjustments"
                    className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { key: 'brightness', label: 'Brightness', icon: Sun, color: 'text-amber-500', min: -100, max: 100 },
                  { key: 'contrast', label: 'Contrast', icon: Contrast, color: 'text-indigo-500', min: -100, max: 100 },
                  { key: 'saturation', label: 'Saturation', icon: Droplets, color: 'text-emerald-500', min: -100, max: 100 },
                  { key: 'warmth', label: 'Warmth', icon: Flame, color: 'text-rose-500', min: -100, max: 100 },
                ].map(ctrl => {
                  const Icon = ctrl.icon;
                  const val = currentAdjustments[ctrl.key as keyof PhotoAdjustments] ?? 0;
                  return (
                    <div key={ctrl.key} className="space-y-1 bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-medium">
                          <Icon className={`w-3.5 h-3.5 ${ctrl.color}`} />
                          <span>{ctrl.label}</span>
                        </span>
                        <span className="font-fredoka text-[11px] text-stone-500 font-semibold w-10 text-right">
                          {val > 0 ? `+${val}` : val}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        value={val}
                        onChange={(e) => handleAdjustmentChange(ctrl.key as keyof PhotoAdjustments, parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-theme-primary"
                      />
                    </div>
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
                <div className="flex items-center gap-3 w-full">
                  <ZoomOut className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.05"
                    value={selectedPhoto?.scale || 1}
                    onChange={(e) => updatePhoto(selectedSlotIndex, { scale: parseFloat(e.target.value) })}
                    className="flex-1 min-w-0 accent-kiwali-coral cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-stone-400 shrink-0" />
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">Show on Strip</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dateStamp.enabled}
                    onClick={() => setDateStamp(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      dateStamp.enabled ? 'bg-theme-primary' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        dateStamp.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {dateStamp.enabled && (
                <>
                  {/* Independent Section 1: Memory Stamp Text */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-theme-primary" />
                        <span>Memory Text</span>
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(dateStamp.stampEnabled)}
                        onClick={() => setDateStamp(prev => ({ ...prev, stampEnabled: !prev.stampEnabled }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          dateStamp.stampEnabled ? 'bg-theme-primary' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            dateStamp.stampEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {Boolean(dateStamp.stampEnabled) && (
                      <div className="space-y-2.5">
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={32}
                            value={dateStamp.stampText ?? dateStamp.customText ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.slice(0, 32);
                              setDateStamp(prev => ({ ...prev, stampText: val, customText: val }));
                            }}
                            placeholder="Write custom message (max 32 chars)..."
                            className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-kiwali-coral pr-14"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-mono select-none">
                            {(dateStamp.stampText ?? dateStamp.customText ?? '').length}/32
                          </span>
                        </div>

                        {/* Memory Stamp Independent Size Slider */}
                        <div className="pt-1 border-t border-stone-200/60 dark:border-stone-700/60">
                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                            <span>Text Size</span>
                            <span className="font-sans font-medium text-[10px] text-stone-400">
                              {dateStamp.stampFontSize || 22}px
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDateStamp(prev => ({ ...prev, stampFontSize: Math.max(14, (prev.stampFontSize || 22) - 2) }))}
                              className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center cursor-pointer text-stone-600 dark:text-stone-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="range"
                              min="14"
                              max="36"
                              step="1"
                              value={dateStamp.stampFontSize || 22}
                              onChange={(e) => setDateStamp(prev => ({ ...prev, stampFontSize: parseInt(e.target.value, 10) }))}
                              className="flex-1 accent-kiwali-coral cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => setDateStamp(prev => ({ ...prev, stampFontSize: Math.min(36, (prev.stampFontSize || 22) + 2) }))}
                              className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center cursor-pointer text-stone-600 dark:text-stone-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                            {[
                              { label: 'S', size: 16 },
                              { label: 'M', size: 22 },
                              { label: 'L', size: 28 },
                              { label: 'XL', size: 34 },
                            ].map(preset => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setDateStamp(prev => ({ ...prev, stampFontSize: preset.size }))}
                                className={`py-0.5 text-[10px] rounded-md border text-center transition-all cursor-pointer ${
                                  (dateStamp.stampFontSize || 22) === preset.size
                                    ? 'border-kiwali-coral bg-kiwali-soft-pink/30 font-semibold text-stone-900 dark:text-white dark:bg-stone-800'
                                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Independent Section 2: Timestamp / Date */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-theme-primary" />
                        <span>Timestamp Date</span>
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(dateStamp.dateEnabled)}
                        onClick={() => setDateStamp(prev => ({ ...prev, dateEnabled: !prev.dateEnabled }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          dateStamp.dateEnabled ? 'bg-theme-primary' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            dateStamp.dateEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {Boolean(dateStamp.dateEnabled) && (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={dateStamp.dateText ?? getFormattedDate(dateStamp.format)}
                          onChange={(e) => setDateStamp(prev => ({ ...prev, dateText: e.target.value }))}
                          placeholder="2026.09.26"
                          className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-xl text-xs font-mono focus:outline-none focus:border-kiwali-coral"
                        />
                        {/* Date Format Presets */}
                        <div className="grid grid-cols-3 gap-1">
                          {(['YYYY.MM.DD', 'MM.DD.YYYY', 'DD.MM.YYYY'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => {
                                const newFormatted = getFormattedDate(fmt);
                                setDateStamp(prev => ({ ...prev, format: fmt, dateText: newFormatted }));
                              }}
                              className={`py-1 text-[10px] font-mono rounded-lg border text-center transition-colors cursor-pointer ${
                                dateStamp.format === fmt
                                  ? 'border-theme-primary bg-theme-soft/30 text-theme-primary font-semibold'
                                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                              }`}
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>

                        {/* Date Stamp Independent Size Slider */}
                        <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                            <span>Date Size</span>
                            <span className="font-sans font-medium text-[10px] text-stone-400">
                              {dateStamp.dateFontSize || 13}px
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDateStamp(prev => ({ ...prev, dateFontSize: Math.max(9, (prev.dateFontSize || 13) - 1) }))}
                              className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center cursor-pointer text-stone-600 dark:text-stone-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="range"
                              min="9"
                              max="24"
                              step="1"
                              value={dateStamp.dateFontSize || 13}
                              onChange={(e) => setDateStamp(prev => ({ ...prev, dateFontSize: parseInt(e.target.value, 10) }))}
                              className="flex-1 accent-kiwali-coral cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => setDateStamp(prev => ({ ...prev, dateFontSize: Math.min(24, (prev.dateFontSize || 13) + 1) }))}
                              className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center cursor-pointer text-stone-600 dark:text-stone-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                            {[
                              { label: 'S', size: 10 },
                              { label: 'M', size: 13 },
                              { label: 'L', size: 16 },
                              { label: 'XL', size: 20 },
                            ].map(preset => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setDateStamp(prev => ({ ...prev, dateFontSize: preset.size }))}
                                className={`py-0.5 text-[10px] rounded-md border text-center transition-all cursor-pointer ${
                                  (dateStamp.dateFontSize || 13) === preset.size
                                    ? 'border-kiwali-coral bg-kiwali-soft-pink/30 font-semibold text-stone-900 dark:text-white dark:bg-stone-800'
                                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
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

                  <div className="pb-6">
                    <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1.5">
                      Typography Color
                    </label>
                    <div className="flex flex-wrap items-center gap-3 p-1">
                      {['#1C1917', '#F8FAFC', '#FF6B81', '#3B82F6', '#10B981', '#A855F7', '#D97706'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDateStamp(prev => ({ ...prev, color: c }))}
                          aria-label={`Select color ${c}`}
                          className={`w-7 h-7 rounded-full border border-stone-300 dark:border-stone-600 transition-all cursor-pointer shadow-xs ${
                            dateStamp.color === c ? 'scale-110 ring-2 ring-kiwali-coral ring-offset-2 ring-offset-white dark:ring-offset-stone-900' : 'hover:scale-105'
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

              {/* Vector Sticker Categories */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {(['All', ...STICKER_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setStickerCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      stickerCategory === cat
                        ? 'soft-btn-coral !p-1 !px-2.5 !text-white font-bold shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Curated Vector Stickers Grid */}
              <div>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1.5 font-medium">
                  Vector Pack ({filteredVectorStickers.length})
                </span>
                <div className="grid grid-cols-4 gap-2 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 max-h-52 overflow-y-auto">
                  {filteredVectorStickers.map((stk) => (
                    <button
                      key={stk.id}
                      type="button"
                      onClick={() => addSticker('', undefined, undefined, stk.dataUrl)}
                      className="group aspect-square rounded-xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 p-1.5 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                      title={`Add ${stk.name}`}
                    >
                      <img
                        src={stk.dataUrl}
                        alt={stk.name}
                        className="w-9 h-9 object-contain pointer-events-none group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[8px] text-stone-500 dark:text-stone-400 mt-1 truncate max-w-full font-medium">
                        {stk.name}
                      </span>
                    </button>
                  ))}
                </div>
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

              {/* Complete Expanded Emoji Selection */}
              <div>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1.5 font-medium">
                  Emoji Collection ({STICKER_PRESETS.length})
                </span>
                <div className="grid grid-cols-6 gap-2 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 max-h-48 overflow-y-auto">
                  {STICKER_PRESETS.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      type="button"
                      onClick={() => addSticker(emoji)}
                      className="w-9 h-9 rounded-lg bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-lg active:scale-95 transition-transform cursor-pointer hover:shadow-2xs"
                      title="Add emoji sticker"
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
      </div>

      {/* Prominent Bottom CTA Bar (Desktop only, mobile actions are hosted inside the floating navbar) */}
      <div className="hidden sm:flex mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 flex-col sm:flex-row items-center justify-between gap-3">
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

      {/* Floating Drag Clone for Photo Drag-and-Drop */}
      {dragState && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-2xl border-2 border-theme-primary bg-white rotate-3 scale-110 transition-transform"
          style={{
            left: dragState.clientX,
            top: dragState.clientY,
            width: 72,
            height: 72,
          }}
        >
          <img
            src={dragState.thumbnailUrl}
            alt="Dragging photo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-theme-primary/10" />
          <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white font-fredoka text-[9px] text-center py-0.5">
            Drop on frame
          </div>
        </div>
      )}
    </div>
  );
};
