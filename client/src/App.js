import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format as dateFnsFormat } from 'date-fns';

const DnDCalendar = withDragAndDrop(Calendar);

const formats = {
    dayFormat: (date, culture, localizer) => dateFnsFormat(date, 'EEEE'),
};

const locales = {
    'en-US': require('date-fns/locale/en-US'),
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

function addHoursToTime(time, hours) {
    const [h, m] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, h, m);
    date.setHours(date.getHours() + Number(hours));
    return date.toTimeString().slice(0, 5);
}

function getDuration(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em - sh * 60 - sm) / 60;
}

function CalendarEvent({ event }) {
    return (
        <div className="slot-info" style={{ width: '100%' }}>
            <div className="slot-task">{event.task}</div>
            <div className="slot-duration">
                {event.duration} hr{event.duration > 1 ? 's' : ''}
            </div>
            {event.location && (
                <div className="slot-location">{event.location}</div>
            )}
            {(event.staff1 || event.staff2) && (
                <div className="slot-staff">
                    {[event.staff1, event.staff2].filter(Boolean).join(', ')}
                </div>
            )}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    event.onDelete(event.id);
                }}
                title="Delete"
            >
                ×
            </button>
        </div>
    );
}

function App() {
    const [slots, setSlots] = useState([]);
    const [form, setForm] = useState({
        day: '', startTime: '', duration: 1, task: '', location: '', staff1: '', staff2: ''
    });
    const [selectedLocation, setSelectedLocation] = useState('');

    useEffect(() => {
        fetch('/api/slots/')
            .then((res) => res.json())
            .then((data) => {
                setSlots(data);
            })
            .catch((err) => console.error('Error fetching slots:', err));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const endTime = addHoursToTime(form.startTime, form.duration);
        fetch('/api/slots/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, endTime }),
        })
            .then((res) => res.json())
            .then((newSlot) => setSlots([...slots, newSlot]))
            .catch((err) => console.error('Error adding slot:', err));
    };

    const handleDelete = (id) => {
        fetch(`/api/slots/${id}`, {
            method: 'DELETE',
        })
            .then((res) => res.json())
            .then(() => setSlots(slots.filter((slot) => slot._id !== id)))
            .catch((err) => console.error('Error deleting slot:', err));
    };

    const handleEventDrop = ({ event, start, end }) => {
        fetch(`/api/slots/${event.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...event,
                startTime: start.toTimeString().slice(0, 5),
                endTime: end.toTimeString().slice(0, 5),
                day: start.toLocaleDateString('en-US', { weekday: 'long' }),
            }),
        })
            .then(res => res.json())
            .then(updated => {
                setSlots(slots.map(slot => slot._id === updated._id ? updated : slot));
            });
    };

    const handleEventResize = ({ event, start, end }) => {
        handleEventDrop({ event, start, end });
    };

    const referenceMonday = new Date(2020, 0, 6);

    const daysOfWeek = {
        Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
        Friday: 4, Saturday: 5, Sunday: 6
    };

    // Main calendar events
    const events = slots.map(slot => {
        const dayOffset = daysOfWeek[slot.day] ?? 0;
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);

        const start = new Date(referenceMonday);
        start.setDate(referenceMonday.getDate() + dayOffset);
        start.setHours(startHour, startMinute, 0, 0);

        const end = new Date(referenceMonday);
        end.setDate(referenceMonday.getDate() + dayOffset);
        end.setHours(endHour, endMinute, 0, 0);

        const duration = getDuration(slot.startTime, slot.endTime);

        return {
            id: slot._id,
            task: slot.task,
            duration,
            location: slot.location,
            staff1: slot.staff1,
            staff2: slot.staff2,
            start,
            end,
            onDelete: handleDelete,
        };
    });

    // Unique locations for selector
    const locations = Array.from(new Set(slots.map(slot => slot.location))).filter(Boolean);

    // Filtered events for selected location
    const locationEvents = slots
        .filter(slot => slot.location === selectedLocation)
        .map(slot => {
            const dayOffset = daysOfWeek[slot.day] ?? 0;
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);

            const start = new Date(referenceMonday);
            start.setDate(referenceMonday.getDate() + dayOffset);
            start.setHours(startHour, startMinute, 0, 0);

            const end = new Date(referenceMonday);
            end.setDate(referenceMonday.getDate() + dayOffset);
            end.setHours(endHour, endMinute, 0, 0);

            const duration = getDuration(slot.startTime, slot.endTime);

            return {
                id: slot._id,
                task: slot.task,
                duration,
                location: slot.location,
                staff1: slot.staff1,
                staff2: slot.staff2,
                start,
                end,
                onDelete: handleDelete,
            };
        });

    return (
        <div className="app">
            <h1>Weekly Timetable</h1>
            <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
                <select
                    name="day"
                    value={form.day}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                </select>
                <input
                    type="text"
                    name="startTime"
                    placeholder="Start Time (e.g. 08:00)"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                />
                <select
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    required
                >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                    <option value={4}>4 hours</option>
                </select>
                <select
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Location</option>
                    <option value="K609">K609</option>
                    <option value="K612">K612</option>
                    <option value="K711">K711</option>
                </select>
                <input
                    name="staff1"
                    placeholder="Staff 1"
                    value={form.staff1}
                    onChange={handleChange}
                    required
                />
                <input
                    name="staff2"
                    placeholder="Staff 2"
                    value={form.staff2}
                    onChange={handleChange}
                    required
                />
                <input name="task" placeholder="Task" value={form.task} onChange={handleChange} required />
                <button type="submit">Add Slot</button>
            </form>

            {/* Location selector for second calendar */}
            <div style={{ margin: '20px 0' }}>
                <label>
                    <strong>View timetable for location: </strong>
                    <select
                        value={selectedLocation}
                        onChange={e => setSelectedLocation(e.target.value)}
                        style={{ marginLeft: 10 }}
                    >
                        <option value="">-- Select Location --</option>
                        {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Main calendar */}
            <div style={{ height: 900 }}>
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    defaultView="work_week"
                    views={['work_week']}
                    toolbar={false}
                    defaultDate={referenceMonday}
                    min={new Date(2020, 0, 6, 8, 0)}
                    max={new Date(2020, 0, 6, 18, 0)}
                    step={30}
                    timeslots={1}
                    style={{ height: '100%' }}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    resizable
                    formats={formats}
                    components={{
                        event: CalendarEvent
                    }}
                    showAllDayEvents={false}
                />
            </div>

            {/* Second calendar for selected location */}
            {selectedLocation && (
                <div style={{ height: 900, marginTop: 40, marginBottom: 100 }}>
                    <h2>Timetable for {selectedLocation}</h2>
                    <DnDCalendar
                        localizer={localizer}
                        events={locationEvents}
                        startAccessor="start"
                        endAccessor="end"
                        defaultView="work_week"
                        views={['work_week']}
                        toolbar={false}
                        defaultDate={referenceMonday}
                        min={new Date(2020, 0, 6, 8, 0)}
                        max={new Date(2020, 0, 6, 18, 0)}
                        step={30}
                        timeslots={1}
                        style={{ height: '100%' }}
                        onEventDrop={handleEventDrop}
                        onEventResize={handleEventResize}
                        resizable
                        formats={formats}
                        components={{
                            event: CalendarEvent
                        }}
                        showAllDayEvents={false}
                    />
                </div>
            )}

            <ul>
                {slots.map((slot) => (
                    <li key={slot._id}>
                        <strong>{slot.day}</strong>: {slot.startTime} - {slot.endTime}
                        {' '}({getDuration(slot.startTime, slot.endTime)} hr{getDuration(slot.startTime, slot.endTime) > 1 ? 's' : ''})
                        {' '}→ {slot.task}
                        {slot.location && <> @ {slot.location}</>}
                        {(slot.staff1 || slot.staff2) && <> [{slot.staff1}{slot.staff1 && slot.staff2 ? ', ' : ''}{slot.staff2}]</>}
                        <button
                            style={{ marginLeft: 10 }}
                            onClick={() => handleDelete(slot._id)}
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;