import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule, NgStyle } from '@angular/common';
import { FileSizePipe } from '../../../../../../../shared/pipes/filesize.pipe';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { FirebaseService } from '../../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../shared/services/confirmation-modal.service';
import { formatEmailKey, sortVideosByDate, initExpandedStates, validateCurrentUser, trackByVideoUrl,
  setupVideoPlayers, onVideoPlay, handleError, calculateTotalSize, updateState, handleVideoUpload, updateUserVideos
} from './video.utils';
import { VideoGridState, UploadProgress } from './video-grid.types';
import { VideoService } from './video.service';

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [CommonModule, FileSizePipe, NgStyle],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
})
export class VideoGridComponent implements OnInit, AfterViewInit {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  @Input() currentUser: User | null = null;
  
  state: VideoGridState = {
    userVideos: [],
    isLoading: false,
    expandedStates: {},
    totalUploadedMB: 0,
    uploadProgress: null,
    uploadedSize: 0,
    totalSize: 0
  };

  private videoService = inject(VideoService);
  private toast = inject(ToastService);
  private confirmationModal = inject(ConfirmationModalService);
  private firebaseService = inject(FirebaseService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    if (validateCurrentUser(this.currentUser)) {
      const userEmailKey = formatEmailKey(this.currentUser!.email!);
      this.loadVideos(userEmailKey);
    }
  }

  ngAfterViewInit(): void {
    this.setupVideoPlayers();
    this.videoPlayers.changes.subscribe(() => this.setupVideoPlayers());
  }

  toggleExpansion(videoUrl: string): void {
    this.state = updateState(
      this.state,
      {
        expandedStates: {
          ...this.state.expandedStates,
          [videoUrl]: !this.state.expandedStates[videoUrl]
        }
      },
      this.ngZone,
      this.cdr
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('video/')) {
      this.toast.show('Formato de archivo inválido. Solo se permiten videos.', 'error');
      input.value = '';
      return;
    }

    this.uploadVideo(file);
  }

  confirmDeleteVideo(videoUrl: string): void {
    this.confirmationModal.show(
      {
        title: 'Eliminar Video',
        message: '¿Estás seguro de que deseas eliminar este video?'
      },
      () => this.deleteVideo(videoUrl)
    );
  }

  private async uploadVideo(file: File): Promise<void> {
    if (!validateCurrentUser(this.currentUser)) return;

    const userEmailKey = formatEmailKey(this.currentUser!.email!);
    this.state = updateState(
      this.state,
      {
        uploadProgress: 0,
        uploadedSize: 0,
        totalSize: file.size,
        isLoading: true
      },
      this.ngZone,
      this.cdr
    );

    try {
      const downloadURL = await handleVideoUpload(
        file,
        userEmailKey,
        this.videoService,
        (progress, uploaded, total) => {
          this.updateUploadProgress({ progress, uploaded, total });
        }
      );

      await updateUserVideos(
        [...this.state.userVideos, downloadURL],
        this.currentUser!,
        this.firebaseService
      );

      this.toast.show('Video subido exitosamente', 'success');
      this.loadVideos(userEmailKey);
    } catch (error) {
      handleError('Error al subir el video', error, this.toast, this.ngZone);
    } finally {
      this.state = updateState(
        this.state,
        {
          uploadProgress: null,
          uploadedSize: 0,
          totalSize: 0,
          isLoading: false
        },
        this.ngZone,
        this.cdr
      );
    }
  }

  private async deleteVideo(videoUrl: string): Promise<void> {
    if (!validateCurrentUser(this.currentUser)) return;

    this.state = updateState(
      this.state,
      { isLoading: true },
      this.ngZone,
      this.cdr
    );

    try {
      await this.videoService.deleteVideo(videoUrl);
      const updatedVideos = this.state.userVideos.filter(vid => vid !== videoUrl);
      await updateUserVideos(
        updatedVideos,
        this.currentUser!,
        this.firebaseService
      );
      this.toast.show('Video eliminado exitosamente', 'success');
      this.loadVideos(formatEmailKey(this.currentUser!.email!));
    } catch (error) {
      handleError('Error eliminando video', error, this.toast, this.ngZone);
    } finally {
      this.state = updateState(
        this.state,
        { isLoading: false },
        this.ngZone,
        this.cdr
      );
    }
  }

  private setupVideoPlayers(): void {
    setupVideoPlayers(
      this.videoPlayers,
      (e: Event) => this.onVideoPlay(e)
    );
  }

  private onVideoPlay(event: Event): void {
    onVideoPlay(event, this.videoPlayers);
  }

  private async loadVideos(userEmailKey: string): Promise<void> {
    this.state = updateState(
      this.state,
      { isLoading: true },
      this.ngZone,
      this.cdr
    );
    
    try {
      const videos = await this.videoService.getVideos(userEmailKey);
      const sortedVideos = sortVideosByDate(videos);
      const totalUploadedMB = await calculateTotalSize(
        sortedVideos,
        this.videoService
      );
      
      this.state = updateState(
        this.state,
        {
          userVideos: sortedVideos,
          expandedStates: initExpandedStates(sortedVideos),
          totalUploadedMB,
          isLoading: false
        },
        this.ngZone,
        this.cdr
      );
    } catch (error) {
      handleError('Error cargando videos', error, this.toast, this.ngZone);
      this.state = updateState(
        this.state,
        { isLoading: false },
        this.ngZone,
        this.cdr
      );
    }
  }

  private updateUploadProgress({ progress, uploaded, total }: UploadProgress): void {
    this.state = updateState(
      this.state,
      {
        uploadProgress: progress,
        uploadedSize: uploaded,
        totalSize: total
      },
      this.ngZone,
      this.cdr
    );
  }

  // Helper para el template (trackBy function)
  trackByVideoUrl = trackByVideoUrl;
}