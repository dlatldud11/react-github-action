import { useState } from "react";
import useFetch from "./hooks/UseFetch";

const API_URL = "https://admin.idiots.band";

export default function IdiotsLiveList() {
  const buildFetchUtl = () => {
    const querystring = [];

    if (date) {
      querystring.push(`date_gte=${date}`);
    }

    if (title.length > 0) {
      querystring.push(`title_contains=${title}`);
    }

    if (bandName.length > 0) {
      querystring.push(`bands.name_contains=${bandName}`);
    }

    return `${API_URL}/lives${
      querystring.length > 0 ? `?${querystring.join("&")}` : ""
    }`;
  };
  const [date, setDate] = useState(null);
  const [title, setTitle] = useState("");
  const [bandName, setBandName] = useState("");

  const [{ isLoading, data, error }, setUrl] = useFetch(buildFetchUtl());

  const handleSubmit = (e) => {
    e.preventDefault();

    setUrl(buildFetchUtl());
  };

  return (
    <div>
      <h1>Idiots Live List</h1>
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              placeholder="공연명"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="함께 한 아티스트명"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
            />
          </div>
          <div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button>검색</button>
        </form>
      </div>
      {error && "뭔가 잘못되었습니다!"}
      {isLoading && <div>Loading...</div>}
      {!isLoading && data && data.length === 0 && <div>No lives found</div>}
      {!isLoading && data && data.length > 0 && (
        <ul>
          {data.map(({ id, title, date, posters, bands }) => (
            <li key={id} style={{ listStyle: "none" }}>
              <h2>{title}</h2>
              <p>{date}</p>
              {posters.length > 0 && (
                <img
                  width="200px"
                  src={`${API_URL}/${posters[0].url}`}
                  alt={`${title} 포스터`}
                />
              )}
              <h3>같이 공연한 밴드</h3>
              <ul>
                {bands.map((band) => (
                  <li key={band.id}>{band.name}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
