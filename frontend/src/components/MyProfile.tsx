import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "./Button";
// import { Card } from "./Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Play } from 'lucide-react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { truncateWalletAddress } from '@/utils/helpers';


interface SpotifyData {
  spotifyProfile: any;
  topArtists: any[];
  topTracks: any[];
  hypeArtist: any[];
}

function MyProfile() {
  const [token, setToken] = useState<string | null>(null);
  const [spotifyData, setSpotifyData] = useState<SpotifyData | null>(null);
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      exchangeCodeForToken(code);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSpotifyData();
    }
  }, [token]);

  const fetchSpotifyData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [profileResponse, artistsResponse, tracksResponse, hypeArtistResponse] = await Promise.all([
        axios.get('https://api.spotify.com/v1/me', {
          headers,
        }),
        axios.get('https://api.spotify.com/v1/me/top/artists', {
          headers,
          params: { time_range: 'long_term', limit: 5 }
        }),
        axios.get('https://api.spotify.com/v1/me/top/tracks', {
          headers,
          params: { time_range: 'long_term', limit: 10 }
        }),
        axios.get('https://api.spotify.com/v1/me/top/artists', {
          headers,
          params: { time_range: 'short_term', limit: 1 }
        }),
      ]);
      const spotifyProfile = profileResponse.data;
      const topArtists = artistsResponse.data.items;
      const topTracks = tracksResponse.data.items;
      // const topGenres = [...new Set(topArtists.flatMap((artist: any) => artist.genres))].slice(0, 5);
      const hypeArtist = hypeArtistResponse.data.items.length > 0 ? hypeArtistResponse.data.items[0] : {name: 'None', images: [{url: '-'}]};
      console.log(spotifyProfile, topArtists, topTracks, hypeArtist);

      setSpotifyData({ spotifyProfile, topArtists, topTracks, hypeArtist });
    } catch (error) {
      console.error('Error fetching Spotify data:', error);
    }
  };

  const handleConnectSpotify = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = encodeURIComponent('http://localhost:5173/profile');
    const scopes = encodeURIComponent('user-read-private user-read-email user-top-read');
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
    
    window.location.href = spotifyAuthUrl;
  };

  const exchangeCodeForToken = async (code: string) => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = 'http://localhost:5173/profile';
    const tokenEndpoint = 'https://accounts.spotify.com/api/token';

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
    });

    try {
      const response = await axios.post(tokenEndpoint, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      setToken(response.data.access_token);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  };

  const getTrackArtists = (artists: any) => {
    return artists.map((artist: any) => artist.name).join(', ');
  }

  return (
    <div className="flex flex-1">
      <main className="flex-1 p-8">
        <Card className="bg-gray-800 border-0 h-full flex flex-col items-center justify-center text-center p-8 rounded-xl">
          {!token ? (
            <>
              <p className="text-gray-400 mb-6">
                Easily connect your Spotify account to start tracking your music
                journey.
                <br/>
                Publish your music identity and connect with other music lovers.
              </p>
              <Button 
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-full flex items-center justify-center"
                onClick={handleConnectSpotify}
              >
                <img src="src/assets/spotify-icon.svg" alt="Spotify" className="w-5 h-5 mr-2" />
                <span>Link your Spotify Profile</span>
              </Button>
            </>
          ) : spotifyData ? (
            <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Recent Hype Card */}
              <Card className="bg-[#1a1b26] text-white border-0 rounded-xl">
                <CardContent className="p-6">
                  <div className="relative mx-auto w-48">
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                      <img
                        src={spotifyData.hypeArtist.images[spotifyData.hypeArtist.images.length - 1].url}
                        alt={spotifyData.hypeArtist.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                      <div className="rounded-lg bg-yellow-500 p-2">
                        <Crown className="h-6 w-6 text-black" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Recent Hype
                    </div>
                    <h2 className="mt-2 text-2xl font-bold">{spotifyData.hypeArtist.name}</h2>
                  </div>
                </CardContent>
              </Card>

              {/* Top Artists Card */}
              <Card className="bg-[#1a1b26] text-white border-0 rounded-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <CardTitle>Top Artists</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {spotifyData.topArtists.map((artist, index) => (
                      <div key={artist.name} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{index + 1}.</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={artist.images[artist.images.length - 1].url} alt={artist.name} />
                          <AvatarFallback>{artist.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{artist.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-8 top-16 flex -space-x-3">
                    {spotifyData.topArtists.slice(0, 5).map((artist) => (
                      <Avatar key={artist.name} className="border-2 border-[#1a1b26]">
                        <AvatarImage src={artist.images[artist.images.length - 1].url} alt={artist.name} />
                        <AvatarFallback>{artist.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Tracks Card */}
              <Card className="bg-[#1a1b26] text-white border-0 rounded-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-orange-500">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <CardTitle>Top 10 Tracks</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {spotifyData.topTracks.map((track , index) => (
                      <div key={track.name} className="flex items-center gap-4">
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <img src={track.album.images[track.album.images.length - 1].url} alt={track.name} className="object-cover" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium leading-none">{track.name}</h3>
                          <p className="text-sm text-muted-foreground">{getTrackArtists(track.artists)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-medium text-muted-foreground">{index + 1}</span>
                          <button className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                            <Play className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Genres Chart Card */}
              {/* <Card className="col-span-full bg-[#1a1b26] text-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <CardTitle>Top Genres</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {data.genres.map((genre) => (
                      <div key={genre.name} className="flex items-center gap-4">
                        <span className="w-16 text-sm">{genre.name}</span>
                        <div className="flex-1">
                          <div className="h-4 rounded bg-[#2a2b36]">
                            <div
                              className="h-full rounded bg-[#4444ff]"
                              style={{ width: `${genre.value}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card> */}
            </div>
          ) : (
            <p className="text-gray-400">Loading Spotify data...</p>
          )}
        </Card>
      </main>

      <aside className="w-80 p-8">
        <Card className="bg-slate-800 p-4 rounded-lg border-0 rounded-xl">
          <div className="flex items-center space-x-4 mb-4">
            {/* <img src="/avatar.png" alt="User Avatar" className="w-16 h-16 rounded-full" /> */}
            <div>
              <h2 className="text-xl font-semibold text-green-500">{spotifyData?.spotifyProfile.display_name}</h2>
              <p className="text-gray-400">{truncateWalletAddress(primaryWallet?.address || '')}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-400">
            <img src="src/assets/spotify-icon.svg" alt="Spotify" className="w-5 h-5 mr-2 inline-block" />
            <span>Spotify: {token ? 'Connected' : '--'}</span>
          </div>
          {spotifyData && (
            <Button variant="outline" className="w-full mt-4">
              Publish Profile
            </Button>
          )}
        </Card>
      </aside>
    </div>
  );
}

export default MyProfile;