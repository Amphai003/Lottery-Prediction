package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const OpenAIKey = ""
const GeminiKey = ""

func CallOpenAI(history string, digits string, count string) string {
	prompt := fmt.Sprintf("Predict %s sets of EXACTLY %s-DIGIT numbers. Format: NUMBER: [digits], WINRATE: [X]%%, EXPLANATION: [Reasoning]. Separate sets with '|||'. History: %s", count, digits, history)
	payload := map[string]interface{}{"model": "gpt-4o", "messages": []map[string]string{{"role": "system", "content": prompt}}}
	data, _ := json.Marshal(payload); req, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", strings.NewReader(string(data)))
	req.Header.Set("Content-Type", "application/json"); req.Header.Set("Authorization", "Bearer "+OpenAIKey)
	resp, _ := (&http.Client{Timeout: 45*time.Second}).Do(req)
	if resp != nil {
		defer resp.Body.Close(); body, _ := io.ReadAll(resp.Body); var res struct { Choices []struct { Message struct { Content string } }; Error struct { Message string } }
		json.Unmarshal(body, &res)
		if len(res.Choices) > 0 { return res.Choices[0].Message.Content }
	}
	return "No Content"
}

func CallGemini(history string, digits string, count string) string {
	m := "models/gemini-1.5-flash"
	prompt := fmt.Sprintf("Predict %s sets of EXACTLY %s-DIGIT numbers. Format: NUMBER: [digits], WINRATE: [X]%%, EXPLANATION: [Reasoning]. Separate sets with '|||'. History: %s", count, digits, history)
	payload := map[string]interface{}{"contents": []map[string]interface{}{{"parts": []map[string]string{{"text": prompt}}}}}
	data, _ := json.Marshal(payload); url := "https://generativelanguage.googleapis.com/v1beta/" + m + ":generateContent?key=" + GeminiKey
	req, _ := http.NewRequest("POST", url, strings.NewReader(string(data))); req.Header.Set("Content-Type", "application/json")
	resp, _ := (&http.Client{Timeout: 45*time.Second}).Do(req)
	if resp != nil {
		defer resp.Body.Close(); body, _ := io.ReadAll(resp.Body); var res struct { Candidates []struct { Content struct { Parts []struct { Text string } } } }
		json.Unmarshal(body, &res)
		if len(res.Candidates) > 0 && len(res.Candidates[0].Content.Parts) > 0 { return res.Candidates[0].Content.Parts[0].Text }
	}
	return "No Content"
}
