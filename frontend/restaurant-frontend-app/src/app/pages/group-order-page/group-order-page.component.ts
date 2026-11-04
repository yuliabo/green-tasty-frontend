import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { ParticipantCardComponent } from '@app/components/group-orders/participant-card/participant-card.component';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';

import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GroupSessionsResponse } from '@app/models/group-orders/group-sessions-response.model';
import { consolidatePreOrder } from '@app/shared/helpers/consolidate-pre-order';
import { exhaustMap, forkJoin, Subscription, switchMap, timer } from 'rxjs';
import { GroupStatusResponse } from '@app/models/group-orders/group-status.model';
import { ModalComponent } from '@app/shared/custom-components/modal/modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Participant } from '@app/models/group-orders/participant.model';

const SYNC_MS = 15_000;

@Component({
  selector: 'app-group-order-page',
  imports: [ParticipantCardComponent, DatePipe, CurrencyPipe, ModalComponent],
  templateUrl: './group-order-page.component.html',
  styleUrl: './group-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GroupOrderPageComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly groupOrdersService = inject(GroupOrdersService);

  readonly reservationId = (this.route.snapshot.paramMap.get('reservationId') ?? '');

  readonly invite = signal<GuestInvite | undefined>(undefined);
  readonly sessions = signal<GroupSessionsResponse | undefined>(undefined);
  readonly status = signal<GroupStatusResponse | undefined>(undefined);
  readonly owner = signal<string | undefined>(undefined);
  readonly sent = signal(false);
  readonly submitting = signal(false);
  readonly dialogOpen = signal(false);
  readonly groupReservationId = signal('');
  readonly loading = signal(false);
  readonly errorStatus = signal<number | null>(null);
  readonly updatedAt = signal<Date | null>(null);
  readonly refreshError = signal(false);
  private syncSub: Subscription | null = null;
  private readonly subscriptions = new Subscription();



  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.errorStatus.set(null);
    this.subscriptions.add(
      this.groupOrdersService.getGroupInvite$(this.reservationId).pipe(
        switchMap(invite => {
          this.invite.set(invite);
          this.groupReservationId.set(invite.GroupReservationId);
          return forkJoin({
            sessions: this.groupOrdersService.getSessions$(invite.GroupReservationId),
            status: this.groupOrdersService.getStatus$(invite.GroupReservationId),
            owner: this.groupOrdersService.getOwnerSessionId$(this.reservationId),

          });
        })
      ).subscribe({
        next: response => {
          this.sessions.set(response.sessions);
          this.status.set(response.status);
          this.owner.set(response.owner);
          this.loading.set(false);
          this.updatedAt.set(new Date());
          this.startSync();
        },
        error: (err: HttpErrorResponse) => {
          this.errorStatus.set(err.status ?? 0);
          this.loading.set(false);
        }
      }));

  }

  readonly participants = computed(() => this.sessions()?.participants ?? []);

  readonly consolidated = computed(() => consolidatePreOrder(this.participants()));

  readonly total = computed(() => this.consolidated().total);

  readonly unsubmittedCount = computed(() => this.participants().filter(participant => !participant.isSubmitted).length);

  readonly sentOut = computed(() => this.sent() || this.status()?.status === 'Submitted');

  readonly hasDishes = computed(() => this.participants().some(p => p.items.length > 0));

  readonly removeTarget = signal<Participant | null>(null);

  openDialog() {
    this.dialogOpen.set(true);
  }

  onSubmit() {
    const groupId = this.groupReservationId();
    if (!groupId) return;
    if (this.submitting()) return;
    this.submitting.set(true);
    this.subscriptions.add(
      this.groupOrdersService.submit$(groupId, this.reservationId).subscribe({
        next: () => {
          this.sent.set(true);
          this.submitting.set(false);
          this.dialogOpen.set(false);
          this.stopSync();
        },
        error: () => this.submitting.set(false),
      }))
  }

  syncNow() {
    this.refreshData$().subscribe({
      next: response => {
        this.sessions.set(response.sessions);
        this.status.set(response.status);
        this.updatedAt.set(new Date());
        this.refreshError.set(false);
        if (response.status.status !== 'Open') this.stopSync();
      },
      error: () => this.refreshError.set(true),
    })
  }

  openRemove(person: Participant) {
    this.removeTarget.set(person);
  }

  confirmRemove() {
    const person = this.removeTarget();
    if (!person) return;
    this.subscriptions.add(
      this.groupOrdersService.removeSession$(this.
        groupReservationId(), person.id).subscribe({

          next: response => {
            this.sessions.set(response); this.
              removeTarget.set(null);
          },
          error: () => { this.removeTarget.set(null); },
        }));
  }

  canRemove(person: Participant): boolean {
    return person.type === 'Guest' && !this.sentOut();
  }

  private refreshData$ = () =>
    forkJoin({
      sessions: this.groupOrdersService.getSessions$(this.
        groupReservationId(), { silent: true }),
      status: this.groupOrdersService.getStatus$(this.groupReservationId(), { silent: true }),
    });

  private startSync() {
    if (this.syncSub && !this.syncSub.closed) return;
    if (this.sent() || this.status()?.status !== 'Open') return;

    this.syncSub = timer(SYNC_MS, SYNC_MS).pipe(
      exhaustMap(() => this.refreshData$()),
    ).subscribe({
      next: response => {
        this.sessions.set(response.sessions);
        this.status.set(response.status);
        this.updatedAt.set(new Date());
        this.refreshError.set(false);
        if (response.status.status !== 'Open') this.stopSync();
      },
      error: () => this.refreshError.set(true),
    })

    this.subscriptions.add(this.syncSub);
  }

  private stopSync() {
    this.syncSub?.unsubscribe();
    this.syncSub = null;
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}

