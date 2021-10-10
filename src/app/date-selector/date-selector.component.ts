import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  OnInit,
  Input,
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
  addMinutes,
  differenceInDays,
  addWeeks,
} from 'date-fns';
import { BehaviorSubject, Subject } from 'rxjs';
import { NgbModal, NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { CoachDateTimeFetchService } from '../services/coach-datetime-fetch.service';
import { Availability } from '../models/availability.model';
import { map } from 'rxjs/operators';

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA',
  },
};

@Component({
  selector: 'date-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-selector.component.html',
  styleUrls: ['./date-selector.component.sass']
})
export class DateSelectorComponent implements OnInit {

  availabilities: Array<Availability> = [];  
  testEmitter$ = new BehaviorSubject<Array<Availability>>(this.availabilities);
  @Input() daysOffset = 0;
  @Input() isVisible: boolean = false;
  timeChunkInMinutes: number = 30;

  constructor(private modal: NgbModal, private coachDateTimeFetchService: CoachDateTimeFetchService) {}

  ngOnInit(): void {
    // gets the availablity from the fetch service and subscribe to the result which will be a list of Availablity object
    this.coachDateTimeFetchService.getAvailability().subscribe(avails => {
      this.availabilities = []; 
      this.daysOffset = 0;
      avails.forEach(ac => {
        this.addAvailabilityEvent(ac);
        this.testEmitter$.next(this.availabilities);
      });
    }); 
  }

  @ViewChild('modalContent', { static: true }) modalContent: TemplateRef<any>;

  view: CalendarView = CalendarView.Week;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  modalData: {
    action: string;
    event: CalendarEvent;
  };

  // Came with library. Didn't have to use it 
  actions: CalendarEventAction[] = [
    {
      label: '',
      a11yLabel: 'Select',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Selected', event, null);
      },
    }
  ];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [
    /*{
      start: subDays(startOfDay(new Date()), 1), // start of the day is always SUNDAY
      end: addDays(new Date(), 0),
      title: 'A 3 day event',
      color: colors.red,
      actions: this.actions,
      allDay: true,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      draggable: true,
    },
    {
      start: startOfDay(new Date()),
      title: 'An event with no end date',
      color: colors.yellow,
      actions: this.actions,
    },
    {
      start: addHours(startOfDay(new Date()), 3),
      end: addHours(new Date(), -10),
      title: 'A draggable and resizable event',
      color: colors.green,
      actions: this.actions,
      draggable: false,
    }
    ,
    {
      start: subDays(endOfMonth(new Date()), 3),
      end: addDays(endOfMonth(new Date()), 3),
      title: 'A long event that spans 2 months',
      color: colors.blue,
      allDay: true,
    },
    {
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(new Date(), 2),
      title: 'A draggable and resizable event',
      color: colors.yellow,
      actions: this.actions,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      draggable: true,
    }, */

  ];

  activeDayIsOpen: boolean = true;

  /* Came with library. Didn't have to use it */
  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  /* Came with library. Didn't have to use it */
  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
    this.handleEvent('Dropped or resized', event, null);
  }

  handleEvent(action: string, event: CalendarEvent, day: Object): void {
    this.modalData = { event, action };
    this.modal.open(this.modalContent, { size: 'lg' });
    console.log("day: ", day);
    // Voila! You've booked the appointment
    alert("Booked a meeting with " + event.title + " at " + event.start + " for " + this.timeChunkInMinutes + " minutes " + action);
  }

  addEvent(): void {
    this.events = [
      ...this.events,
      {
        title: 'New event',
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color: colors.red,
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
      },
    ];
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter((event) => event !== eventToDelete);
  }

  setView(view: CalendarView) {
    this.view = view;
    this.daysOffset = 0;
    this.activeDayIsOpen = false;
    this.addDaysOffset();
  }

  closeOpenMonthViewDay(right) {
    this.activeDayIsOpen = false;
    var offsetNumber = 7;
    if(this.view == CalendarView.Week || this.view == CalendarView.Month) 
      offsetNumber = 7;
    else if(this.view = CalendarView.Day) 
      offsetNumber = 1;
     
    if(right) this.daysOffset += offsetNumber;
    else this.daysOffset -= offsetNumber;

    this.addDaysOffset();
  }

  /**
   * When a person moves to the next week or previous week, the offset of 7 or -7 is added in the view
   */
  addDaysOffset() {
    this.coachDateTimeFetchService.getAvailability().subscribe(avails => {
    this.events = [];
    this.availabilities = [];

    avails.forEach(avail => {
        if(this.view == CalendarView.Week || this.view == CalendarView.Month)
          this.addAvailabilityEvent(avail);
        else if(this.view == CalendarView.Day)
          this.addAvailabilityEventDaily(avail);

        // console.log("New Available Times: \n", availab, ", offset: ", this.daysOffset , " with selected Coach count: " + this.coachDateTimeFetchService.selectedCoaches.length);
        this.testEmitter$.next(this.availabilities); 
      });
    });
  }

  /**
   * For declaring add availability daily 
   ***/
  addAvailabilityEventDaily(avail: Availability) {
    if(avail && avail.availableFrom) { 

      // setting correct offset
      let startDate = addWeeks(avail.availableFrom, Math.floor(this.daysOffset / 7));
      let endDate = addWeeks(avail.availableTo, Math.floor(this.daysOffset / 7));

      let refDate = new Date(); //addDays(new Date(), this.daysOffset);

      let d = new Date(startDate.getTime());            // this is the base availabilty object to refer to the actual start date
      let chunkedAvail = new Date(startDate.getTime()); // this is the moving availability object in the loop
      let minutesToAdd = this.timeChunkInMinutes;       // since we are doing 30 minutes increment for each blocks
      
      //console.log("\nSTART: ", startDate, "\nREF: ", addDays(new Date(), this.daysOffset), "\nEND: ", endDate);

      while(this.isTheSameDay(chunkedAvail, refDate) && this.isTheSameDay(endDate, refDate) && this.coachDateTimeFetchService.selectedCoaches.includes(avail.name)) {
        let endingTime = addMinutes(d, minutesToAdd);

        // create a new availabiliity object in order to avoid memory back referencing
        let availab = new Availability();
        availab.name = avail.name;
        availab.availableFrom = new Date(chunkedAvail.getTime());
        availab.availableTo = new Date(endingTime.getTime());

        this.availabilities.push(availab);
    // console.log("\nYAY :D ", availab);
        // only add in the calendar if selected in the Coach Selector
        if(this.coachDateTimeFetchService.selectedCoaches.includes(avail.name)) {
          // console.log("Splitting time for  ", avail.name, " TO ", chunkedAvail, " and ENDING at ", endingTime, "\n main End time: ", avail.availableTo);
          this.events.push({
            start: addHours(chunkedAvail, 0), 
            end: addHours(endingTime, 0),
            title: avail.name,
            color: colors.blue,
            actions: this.actions,
            draggable: false,
          });
        }

        chunkedAvail = endingTime;
        minutesToAdd += this.timeChunkInMinutes;
      }
    }
  }


  /**
   * For each availability, divide it up into a blocks of 30 minutes event availability. So if you have 4 availability per day and each day is divided up into 5 of
   * 30 minute blocks, you have 4*5=20 final availability blocks to see in your calendar
   */
  addAvailabilityEvent(avail: Availability) {
    if(avail && avail.availableFrom) {
      // setting correct offset
      let startDate = addDays(avail.availableFrom, this.daysOffset);
      let endDate = addDays(avail.availableTo, this.daysOffset);

      let d = new Date(startDate.getTime());            // this is the base availabilty object to refer to the actual start date
      let chunkedAvail = new Date(startDate.getTime()); // this is the moving availability object in the loop
      let minutesToAdd = this.timeChunkInMinutes;       // since we are doing 30 minutes increment for each blocks

      while(chunkedAvail.getTime() < endDate.getTime()) {
        let endingTime = addMinutes(d, minutesToAdd);

        // create a new availabiliity object in order to avoid memory back referencing
        let availab = new Availability();
        availab.name = avail.name;
        availab.availableFrom = new Date(chunkedAvail.getTime());
        availab.availableTo = new Date(endingTime.getTime());

        this.availabilities.push(availab);

        // only add in the calendar if selected in the Coach Selector
        if(this.coachDateTimeFetchService.selectedCoaches.includes(avail.name)) {
          // console.log("Splitting time for  ", avail.name, " TO ", chunkedAvail, " and ENDING at ", endingTime, "\n main End time: ", avail.availableTo);
          this.events.push({
            start: addHours(chunkedAvail, 0), 
            end: addHours(endingTime, 0),
            title: avail.name,
            color: colors.blue,
            actions: this.actions,
            draggable: false,
          });
        }

        chunkedAvail = endingTime;
        minutesToAdd += this.timeChunkInMinutes;
      }
    }
  }

  isTheSameDay(someDate, refDate) : boolean {
    const today = addDays(refDate, this.daysOffset);
    return someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
  };

  setVisibility(val: boolean) {
    this.isVisible = val;
    this.daysOffset = 0;
  }
}
