"use client"
import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface VideoTextureScreenProps {
  src: string;
  width?: number;
  height?: number;
  muted?: boolean;
  emissiveIntensity?: number;
}

export function VideoTextureScreen({
  src,
  width = 4,
  height = 2.25,
  muted = true,
  emissiveIntensity = 1.4,
}: VideoTextureScreenProps) {
  const video = useMemo(() => {
    const element = document.createElement("video");

    element.src = src;
    element.crossOrigin = "anonymous";
    element.loop = true;
    element.muted = muted;
    element.playsInline = true;
    element.preload = "metadata";

    return element;
  }, [src, muted]);

  const texture = useMemo(() => {
    const nextTexture = new THREE.VideoTexture(video);

    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    nextTexture.generateMipmaps = false;

    return nextTexture;
  }, [video]);

  useEffect(() => {
    const startPlayback = async () => {
      try {
        await video.play();
      } catch {
        // Playback will begin after the user's first interaction.
        const resume = async () => {
          await video.play().catch(() => undefined);
          window.removeEventListener("pointerdown", resume);
        };

        window.addEventListener("pointerdown", resume, { once: true });
      }
    };

    void startPlayback();

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      texture.dispose();
    };
  }, [video, texture]);

  return (
    <mesh>
      <planeGeometry args={[width, height]} />

      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive={new THREE.Color("#ffffff")}
        emissiveIntensity={emissiveIntensity}
        toneMapped
      />
    </mesh>
  );
}
