/*
 * Retrieves and parses the synced lyrics for a specific track in MusicAssistant.
 */

package musicassistant

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"vinyl-orchestrator/typedefs"

	"github.com/mitchellh/mapstructure"
)

type RawTrack_t struct {
	LRCLyrics string `mapstructure:"lrc_lyrics"`
	Metadata  struct {
		LRCLyrics string `mapstructure:"lrc_lyrics"`
	} `mapstructure:"metadata"`
}

func (instance *SystemMediaPlayer_t) getTrackLyrics(itemId string, provider string) (typedefs.TrackLyrics_t, error) {

	response, err := instance._private.messageRouter.ExecuteRemoteProcedureCall("music/item", map[string]interface{}{
		"media_type":                     "track",
		"item_id":                        itemId,
		"provider_instance_id_or_domain": provider,
	})
	if err != nil {
		return typedefs.TrackLyrics_t{}, err
	}

	rawResult, ok := response["result"]
	if !ok {
		return typedefs.TrackLyrics_t{}, fmt.Errorf("response did not contain a 'result' field")
	}

	var rawTrack RawTrack_t

	err = mapstructure.Decode(rawResult, &rawTrack)
	if err != nil {
		return typedefs.TrackLyrics_t{}, fmt.Errorf("failed to decode track details: %w", err)
	}

	rawLRC := rawTrack.LRCLyrics
	if rawLRC == "" {
		rawLRC = rawTrack.Metadata.LRCLyrics
	}

	if rawLRC == "" {
		return typedefs.TrackLyrics_t{}, nil
	}

	parsedLyrics := parseLRCLyrics(rawLRC)

	return parsedLyrics, nil
}
func parseLRCLyrics(rawLRC string) typedefs.TrackLyrics_t {
	var lyrics typedefs.TrackLyrics_t

	lines := strings.Split(rawLRC, "\n")
	timestampRegex := regexp.MustCompile(`\[(\d{1,2}):(\d{2})(?:[\.:](\d{1,3}))?\]`)

	for _, line := range lines {
		timeMatches := timestampRegex.FindAllStringSubmatch(line, -1)
		if len(timeMatches) == 0 {
			continue
		}

		text := strings.TrimSpace(timestampRegex.ReplaceAllString(line, ""))
		if text == "" {
			continue
		}

		for _, match := range timeMatches {
			mins, _ := strconv.ParseFloat(match[1], 64)
			secs, _ := strconv.ParseFloat(match[2], 64)

			fractions := 0.0
			fractionRaw := match[3]
			if fractionRaw != "" {
				fractions, _ = strconv.ParseFloat(fractionRaw, 64)
				switch len(fractionRaw) {
				case 1:
					fractions *= 100
				case 2:
					fractions *= 10
				}
			}

			totalSeconds := (mins * 60) + secs + (fractions / 1000)

			lyrics.Lines = append(lyrics.Lines, typedefs.LyricLine_t{
				TimeStart: totalSeconds,
				Text:      text,
			})
		}
	}

	return lyrics
}
