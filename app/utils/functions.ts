import dayjs from "dayjs"

export const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return dayjs()
        .startOf('day')
        .add(Number(hours), 'hour')
        .add(Number(minutes), 'minute')
        .format('h:mm A')
}