export type Locale = "es" | "en";

export interface Translations {
  nav: {
    home: string;
    shorts: string;
    genres: string;
    myList: string;
    randomTooltip: string;
    randomAria: string;
    searchPlaceholder: string;
    language: string;
  };
  hero: {
    minutes: string;
    watchShort: string;
  };
  videoCard: {
    watchAria: string;
    play: string;
    addToWatchlist: string;
    removeFromWatchlist: string;
    saved: string;
    newRelease: string;
    durationMinutes: string;
  };
  home: {
    billboard: string;
    latestReleases: string;
    continueWatching: string;
    selectionOf: string;
    loading: string;
    empty: string;
  };
  watch: {
    notFound: string;
    backToHome: string;
    inMyList: string;
    addToMyList: string;
    removedFromList: string;
    addedToList: string;
    share: string;
    shareText: string;
    linkCopied: string;
    linkCopyError: string;
    minimizePip: string;
    minimizeTooltip: string;
    startPlayback: string;
    resumeAt: string;
    playFromBeginning: string;
    similarTitles: string;
    loading: string;
  };
  shorts: {
    title: string;
    loading: string;
    error: string;
  };
  genres: {
    title: string;
    specialRoom: string;
    enter: string;
    exploreHall: string;
    loadingRoom: string;
    loadError: string;
  };
  myList: {
    title: string;
    subtitle: string;
    stats: string;
    emptyTitle: string;
    emptyDesc: string;
    exploreBillboard: string;
    searchPlaceholder: string;
    allGenres: string;
    sortBy: string;
    sortRecent: string;
    sortDurationAsc: string;
    sortDurationDesc: string;
    sortTitleAsc: string;
    sortTitleDesc: string;
    exportJson: string;
    importJson: string;
    clearList: string;
    clearConfirm: string;
    clearSuccess: string;
    exportSuccess: string;
    importSuccess: string;
    importError: string;
    noFilterResults: string;
    resetFilters: string;
  };
  search: {
    title: string;
    resultsCount: string;
    noResultsTitle: string;
    noResultsDesc: string;
    clearFilters: string;
    allDurations: string;
    short: string;
    medium: string;
    long: string;
    sortBy: string;
    relevance: string;
    recent: string;
    durationAsc: string;
    durationDesc: string;
  };
  shortcuts: {
    badge: string;
    title: string;
    desc: string;
    playPause: string;
    playPauseDesc: string;
    rewind: string;
    rewindDesc: string;
    forward: string;
    forwardDesc: string;
    mute: string;
    muteDesc: string;
    fullscreen: string;
    fullscreenDesc: string;
    pip: string;
    pipDesc: string;
    guide: string;
    guideDesc: string;
    close: string;
    closeDesc: string;
    pressToExit: string;
    understood: string;
  };
  floatingPlayer: {
    maximize: string;
    close: string;
    playing: string;
    paused: string;
  };
  globalShortcuts: {
    controls: string;
    tooltip: string;
  };
  genresMap: Record<string, string>;
}
