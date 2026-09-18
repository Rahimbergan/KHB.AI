import { request } from './client';
import { Artifact } from '../types/artifacts';

export async function getArtifactById(artifactId: string): Promise<Artifact> {
  return await request<Artifact>(`/api/v1/artifacts/${artifactId}`);
}
